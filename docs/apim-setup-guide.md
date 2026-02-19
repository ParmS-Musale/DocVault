# Azure API Management — Setup & Import Guide

> **Branch workflow:** `feature/apim` → PR to `dev` → review → merge → PR to `main`

---

## Prerequisites

| Item | Status |
|------|--------|
| Azure CLI installed & logged in (`az login`) | ☐ |
| DocVault API deployed to App Service | ☐ |
| Resource group `docvault-rg` exists | ☐ |
| Swagger/OpenAPI enabled on the API (already in `Program.cs`) | ☐ |

---

## Step 0 — Create the Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/apim
```

---

## Step 1 — Expose Swagger in Non-Development Environments

Your current `Program.cs` only enables Swagger in Development. APIM needs the OpenAPI spec to import your API, so you must expose it (at least temporarily, or behind a path).

**Option A — Keep Swagger always on (recommended for internal APIs):**

Edit [Program.cs](file:///c:/Users/Prajwal/Desktop/DocVault/DocVault/backend/DocVault.API/Program.cs) — move Swagger outside the `IsDevelopment` check:

```diff
-if (app.Environment.IsDevelopment())
-{
-    app.UseSwagger();
-    app.UseSwaggerUI();
-}
+// Swagger available in all environments for APIM import
+app.UseSwagger();
+if (app.Environment.IsDevelopment())
+{
+    app.UseSwaggerUI();
+}
```

> [!TIP]
> After APIM import you can revert this if you want to hide SwaggerUI in production — APIM only needs the initial JSON spec to import.

Commit this change:
```bash
git add backend/DocVault.API/Program.cs
git commit -m "feat(api): expose Swagger JSON endpoint for APIM import"
```

---

## Step 2 — Create the APIM Instance (Azure CLI)

> [!IMPORTANT]
> APIM provisioning takes **30–60 minutes** for `Developer` tier. Use `Consumption` tier for faster provisioning (~5 minutes) and zero idle cost, but note it has fewer features (no built-in developer portal, no cache policy).

### Option A — Consumption Tier (faster, pay-per-call)

```bash
az apim create \
  --name docvault-apim \
  --resource-group docvault-rg \
  --location centralindia \
  --publisher-name "DocVault Team" \
  --publisher-email your-email@example.com \
  --sku-name Consumption
```

### Option B — Developer Tier (full features, fixed cost)

```bash
az apim create \
  --name docvault-apim \
  --resource-group docvault-rg \
  --location centralindia \
  --publisher-name "DocVault Team" \
  --publisher-email your-email@example.com \
  --sku-name Developer
```

> [!CAUTION]
> Replace `your-email@example.com` with a real email. The APIM name `docvault-apim` must be **globally unique** — append a random suffix if needed (e.g., `docvault-apim-29471`).

**Verify creation:**
```bash
az apim show --name docvault-apim --resource-group docvault-rg --query "{name:name, gatewayUrl:gatewayUrl, sku:sku.name}" -o table
```

Note the **Gateway URL** — this is the base URL your Angular app will call (e.g., `https://docvault-apim.azure-api.net`).

---

## Step 3 — Import Your .NET API into APIM

You need your App Service's Swagger JSON URL. If your API is deployed at `https://docvault-api.azurewebsites.net`, the spec lives at:

```
https://docvault-api.azurewebsites.net/swagger/v1/swagger.json
```

### Import via CLI

```bash
az apim api import \
  --resource-group docvault-rg \
  --service-name docvault-apim \
  --api-id docvault-api \
  --path "api" \
  --display-name "DocVault API" \
  --service-url "https://docvault-api.azurewebsites.net" \
  --specification-format OpenApi \
  --specification-url "https://docvault-api.azurewebsites.net/swagger/v1/swagger.json" \
  --subscription-required false
```

> [!NOTE]
> `--path "api"` means APIM will serve your API at `https://docvault-apim.azure-api.net/api/*`.  
> `--subscription-required false` disables APIM subscription keys initially (your API already uses Entra ID JWT auth).

### Import via Azure Portal (alternative)

1. Go to **Azure Portal → API Management → docvault-apim → APIs**
2. Click **+ Add API → OpenAPI**
3. Enter your Swagger JSON URL: `https://docvault-api.azurewebsites.net/swagger/v1/swagger.json`
4. Set **API URL suffix** to `api`
5. Click **Create**

**Verify the import worked:**
```bash
az apim api list \
  --resource-group docvault-rg \
  --service-name docvault-apim \
  --query "[].{name:displayName, path:path}" -o table
```

---

## Step 4 — Add Inbound Policies

### 4a. Rate Limiting (10 calls/min per user)

```bash
az apim api policy set \
  --resource-group docvault-rg \
  --service-name docvault-apim \
  --api-id docvault-api \
  --xml-policy '<policies>
  <inbound>
    <base />
    <rate-limit calls="10" renewal-period="60" remaining-calls-header-name="X-RateLimit-Remaining" />
    <cors allow-credentials="true">
      <allowed-origins>
        <origin>http://localhost:4200</origin>
        <origin>https://your-angular-app.azurestaticapps.net</origin>
      </allowed-origins>
      <allowed-methods preflight-result-max-age="300">
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>DELETE</method>
        <method>OPTIONS</method>
      </allowed-methods>
      <allowed-headers>
        <header>Authorization</header>
        <header>Content-Type</header>
        <header>Accept</header>
      </allowed-headers>
    </cors>
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>'
```

### 4b. Add Cache on GET /api/documents (Portal method)

Caching policy is simpler to add per-operation in the Portal:

1. Go to **APIM → APIs → DocVault API → GET /api/documents** operation
2. Click **Inbound processing → Add policy → Cache responses**
3. Set duration to `120` seconds
4. Save

Or use this XML on the specific operation:
```xml
<inbound>
  <base />
  <cache-lookup vary-by-developer="false" vary-by-developer-groups="false" />
</inbound>
<outbound>
  <base />
  <cache-store duration="120" />
</outbound>
```

> [!WARNING]
> Cache policy is **not available** on Consumption tier. If you chose Consumption, skip caching or use a different caching strategy (e.g., Redis Cache).

---

## Step 5 — Update Angular to Call APIM Gateway

Edit [msal.config.ts](file:///c:/Users/Prajwal/Desktop/DocVault/DocVault/frontend/src/app/msal.config.ts) — update the protected resource map:

```diff
-protectedResourceMap.set("http://localhost:5000/api", [
+protectedResourceMap.set("https://docvault-apim.azure-api.net/api", [
   `api://${API_CLIENT_ID}/access_as_user`,
 ]);
```

Also update [proxy.conf.json](file:///c:/Users/Prajwal/Desktop/DocVault/DocVault/frontend/proxy.conf.json) for local development if needed, or use an environment variable approach:

**Create/update `src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api'  // direct for local dev
};
```

**Create/update `src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://docvault-apim.azure-api.net/api'  // via APIM in prod
};
```

Then use `environment.apiBaseUrl` in your services and MSAL config.

---

## Step 6 — Add APIM Backend Health Endpoint

Verify APIM can reach your backend:

```bash
curl -s https://docvault-apim.azure-api.net/api/documents/health | jq .
```

Expected response:
```json
{
  "status": "Healthy",
  "timestamp": "2026-02-19T12:30:00Z",
  "version": "1.0.0"
}
```

> [!NOTE]
> The `/health` endpoint has `[AllowAnonymous]` so it works without a JWT — perfect for APIM health probes and availability tests.

---

## Step 7 — Commit, Push & Create PR

```bash
# Stage all changes
git add .
git commit -m "feat(apim): create APIM instance and import DocVault API

- Expose Swagger JSON for APIM import
- Configure rate limiting (10 calls/min)
- Configure CORS policy for Angular origins
- Update Angular to use APIM gateway URL in production"

# Push branch
git push -u origin feature/apim
```

**Create the Pull Request:**
```bash
# Using GitHub CLI (if installed)
gh pr create \
  --base dev \
  --title "feat: Add Azure API Management with policies" \
  --body "## Changes
- Created APIM instance (Consumption/Developer tier)
- Imported DocVault API via OpenAPI spec
- Added rate limiting: 10 calls/min per user
- Added CORS policy for Angular origins
- Added cache-lookup on GET /api/documents
- Updated Angular to call APIM gateway in production

## Testing
- [ ] APIM health endpoint returns 200
- [ ] Rate limit headers appear in responses
- [ ] Angular SPA authenticates through APIM
- [ ] CORS preflight succeeds from localhost:4200"
```

Or create the PR manually on GitHub.

---

## Step 8 — Post-Merge Verification Checklist

After PR review and merge to `dev`:

| Check | Command / Action |
|-------|-----------------|
| APIM is running | `az apim show --name docvault-apim -g docvault-rg -o table` |
| API imported | `az apim api list --service-name docvault-apim -g docvault-rg -o table` |
| Health endpoint works via APIM | `curl https://docvault-apim.azure-api.net/api/documents/health` |
| Rate limit headers present | Check `X-RateLimit-Remaining` in response headers |
| CORS works | Test from Angular dev server |
| Auth flow works end-to-end | Login → list docs → upload via APIM URL |

---

## Infra Script Addition

Add this to your [azure_setup.sh](file:///c:/Users/Prajwal/Desktop/DocVault/DocVault/infra/azure_setup.sh) or create a new `infra/apim_setup.sh`:

```bash
#!/bin/bash
# DocVault – APIM Infrastructure Setup

RESOURCE_GROUP="docvault-rg"
LOCATION="centralindia"
APIM_NAME="docvault-apim"
API_URL="https://docvault-api.azurewebsites.net"

echo "Step 1: Creating APIM instance (this takes 5-60 min)..."
az apim create \
  --name $APIM_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --publisher-name "DocVault Team" \
  --publisher-email "admin@docvault.com" \
  --sku-name Consumption

echo "Step 2: Importing API from OpenAPI spec..."
az apim api import \
  --resource-group $RESOURCE_GROUP \
  --service-name $APIM_NAME \
  --api-id docvault-api \
  --path "api" \
  --display-name "DocVault API" \
  --service-url "$API_URL" \
  --specification-format OpenApi \
  --specification-url "$API_URL/swagger/v1/swagger.json" \
  --subscription-required false

echo "APIM setup complete ✅"
echo "Gateway URL: https://$APIM_NAME.azure-api.net"
```

---

## Common Pitfalls

> [!CAUTION]
> **AZ-204 Exam Pitfalls to watch for:**

| Pitfall | Solution |
|---------|----------|
| APIM subscription key required by default | Set `--subscription-required false` or pass `Ocp-Apim-Subscription-Key` header |
| Swagger not available in production | Ensure `app.UseSwagger()` runs outside `IsDevelopment()` block |
| CORS double-handling (APIM + API) | Disable CORS in your .NET API when behind APIM, let APIM handle it |
| Rate limit is per-subscription, not per-user by default | Use `rate-limit-by-key` with `@(context.Request.Headers.GetValueOrDefault("Authorization",""))` for per-user limiting |
| Cache returns stale data after upload | Use `cache-remove-value` in POST operations or set short TTL |
| Consumption tier has no cache policy | Use Developer tier or external Redis for caching |
