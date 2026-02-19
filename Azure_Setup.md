# Azure Setup Guide for DocVault

Follow these steps to provision the required Azure resources.

## 1. Resource Group
Create a dedicated Resource Group (e.g., `rg-docvault-dev`).

## 2. Storage Account
- Create a Storage Account (Standard General Purpose v2).
- Create a container named `docvault-files`.
- **Identity**: Assign `Storage Blob Data Contributor` to your user and the App Service/Function App Managed Identity.

## 3. Cosmos DB
- Create an Azure Cosmos DB for NoSQL account.
- Create a database `DocVaultDB` (or `docvault-db`).
- Create a container `Documents` (or `documents`) with Partition Key `/userId`.

## 4. Entra ID (Azure AD)
- **App Registration 1 (Frontend)**:
  - Platform: SPA
  - Redirect URI: `http://localhost:4200`
  - Grant admin consent for `User.Read`.
- **App Registration 2 (Backend)**:
  - Expose an API: `api://<client-id>/access_as_user`.
  - Add Scope: `access_as_user`.
  - Authorize the Frontend Client ID.

## 5. Key Vault
- Create a Key Vault.
- Store secrets if not using Managed Identity entirely (e.g., Service Bus Connection String).
- Assign `Key Vault Secrets User` role to your identity.

## 6. Event Grid & Service Bus
- **Event Grid**: Create a System Topic for the Storage Account (Blob Created) OR a Custom Topic.
- **Service Bus**: Create a Namespace and a Queue named `docvault-queue`.
- Update `appsettings.json` with endpoints.

## 7. Application Insights
- Create an Application Insights resource.
- Copy the Connection String to `appsettings.json` and `host.json`.
