# DocVault 🗄️

> **Production-ready document management application** built with Angular 17+, .NET 8 Web API, Azure Blob Storage, and Azure Cosmos DB.

![DocVault Architecture](docs/architecture.png)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Local Development Setup](#local-development-setup)
6. [Azure Infrastructure Setup](#azure-infrastructure-setup)
7. [Environment Configuration](#environment-configuration)
8. [API Reference](#api-reference)
9. [CI/CD Deployment](#cicd-deployment)
10. [Security Considerations](#security-considerations)
11. [Blob Lifecycle Policy](#blob-lifecycle-policy)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│              Angular 17+ SPA (standalone components)        │
│         Home │ Upload (drag & drop) │ Document List         │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API calls
┌────────────────────────▼────────────────────────────────────┐
│               .NET 8 Web API (Azure App Service)            │
│         DocumentsController → DocumentService               │
└──────────────┬─────────────────────────┬────────────────────┘
               │                         │
┌──────────────▼──────────┐  ┌───────────▼──────────────────┐
│  Azure Blob Storage     │  │  Azure Cosmos DB (Core SQL)  │
│  - Raw file storage     │  │  - Document metadata         │
│  - SAS URL generation   │  │  - Partitioned by /userId    │
│  - Lifecycle policies   │  │  - Session consistency       │
└─────────────────────────┘  └──────────────────────────────┘
```

---

## Tech Stack

| Layer    | Technology                      | Version |
| -------- | ------------------------------- | ------- |
| Frontend | Angular (standalone components) | 17.3+   |
| UI Kit   | Angular Material                | 17.3+   |
| Backend  | ASP.NET Core Web API            | .NET 8  |
| Storage  | Azure Blob Storage (SDK v12)    | 12.21+  |
| Database | Azure Cosmos DB (Core SQL)      | 3.39+   |
| CI/CD    | GitHub Actions                  | Latest  |
| Cloud    | Microsoft Azure                 | –       |

---

## Project Structure

```
docvault/
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions CI/CD
│
├── backend/
│   └── DocVault.API/
│       ├── Configuration/
│       │   └── AzureOptions.cs       # Strongly-typed config
│       ├── Controllers/
│       │   └── DocumentsController.cs
│       ├── DTOs/
│       │   └── DocumentDtos.cs       # Request/response contracts
│       ├── Interfaces/
│       │   └── IServices.cs          # Service abstractions
│       ├── Models/
│       │   └── DocumentRecord.cs     # Cosmos DB entity
│       ├── Services/
│       │   ├── BlobStorageService.cs
│       │   ├── CosmosDbService.cs
│       │   └── DocumentService.cs    # Orchestration layer
│       ├── Properties/
│       │   └── launchSettings.json
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       └── Program.cs
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── home/
│   │   │   │   │   └── home.component.ts
│   │   │   │   ├── upload/
│   │   │   │   │   └── upload.component.ts
│   │   │   │   ├── document-list/
│   │   │   │   │   └── document-list.component.ts
│   │   │   │   └── shared/nav/
│   │   │   │       └── nav.component.ts
│   │   │   ├── models/
│   │   │   │   └── document.model.ts
│   │   │   ├── services/
│   │   │   │   └── document.service.ts
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── environments/
│   │   │   ├── environment.ts        # Dev
│   │   │   └── environment.prod.ts   # Prod
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
└── infrastructure/
    └── setup-azure.sh                # Azure CLI provisioning script
```

---

## Prerequisites

| Tool        | Minimum Version | Install                               |
| ----------- | --------------- | ------------------------------------- |
| Node.js     | 20.x            | https://nodejs.org                    |
| Angular CLI | 17.3+           | `npm i -g @angular/cli`               |
| .NET SDK    | 8.0             | https://dotnet.microsoft.com/download |
| Azure CLI   | 2.56+           | https://aka.ms/installazurecliwindows |
| Git         | Any             | https://git-scm.com                   |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/docvault.git
cd docvault
```

### 2. Configure the Backend

Create your local development settings file:

Windows (PowerShell):
copy appsettings.Development.template.json appsettings.Development.json

Mac / Linux:
cp appsettings.Development.template.json appsettings.Development.json

Open `appsettings.Development.json` and replace:

- YOUR_STORAGE_CONNECTION_STRING
- YOUR_COSMOS_CONNECTION_STRING

`appsettings.Development.json` contains secrets and is ignored by Git.
Never commit this file.

````

> **Never commit real credentials.** Use environment variables or dotnet user-secrets locally:
> ```bash
> cd backend/DocVault.API
> dotnet user-secrets set "AzureStorage:ConnectionString" "your-connection-string"
> dotnet user-secrets set "CosmosDb:ConnectionString" "your-cosmos-string"
> ```

### 3. Run the Backend API

```bash
cd backend/DocVault.API
dotnet restore
dotnet run

# API will be available at:
# → http://localhost:5000
# → https://localhost:5001
# → Swagger UI: http://localhost:5000/swagger
````

### 4. Run the Angular Frontend

```bash
cd frontend
npm install
npm start

# Angular dev server: http://localhost:4200
```

The frontend proxies API calls to `http://localhost:5000/api` by default.

### 5. Verify the Setup

- Open http://localhost:4200 — you should see the DocVault home page
- Open http://localhost:5000/swagger — API documentation
- Open http://localhost:5000/api/documents/health — health check

---

## Azure Infrastructure Setup

```bash
cd infrastructure
chmod +x setup-azure.sh
az login
./setup-azure.sh
```

The script provisions:

- Resource Group
- Storage Account + Blob Container
- Blob Lifecycle Policy (Cool @ 30d, Archive @ 180d)
- Cosmos DB Account, Database, Container (`/userId` partition key)
- App Service Plan (Linux B2)
- App Service Web App (.NET 8)

---

## Environment Configuration

### Backend – appsettings.json

| Key                             | Description                    |
| ------------------------------- | ------------------------------ |
| `AzureStorage:ConnectionString` | Blob Storage connection string |
| `AzureStorage:ContainerName`    | Blob container name            |
| `CosmosDb:ConnectionString`     | Cosmos DB connection string    |
| `CosmosDb:DatabaseName`         | Cosmos DB database name        |
| `CosmosDb:ContainerName`        | Cosmos DB container name       |
| `AllowedOrigins`                | CORS allowed origins array     |

### Frontend – environment.ts

| Key          | Description              |
| ------------ | ------------------------ |
| `apiBaseUrl` | Base URL of the .NET API |

---

## API Reference

### `GET /api/documents/health`

Returns API liveness status.

**Response 200:**

```json
{ "status": "Healthy", "timestamp": "2025-01-01T00:00:00Z", "version": "1.0.0" }
```

---

### `GET /api/documents`

Returns all documents for the current user, each with a fresh SAS download URL.

**Response 200:**

```json
[
	{
		"id": "abc123",
		"fileName": "report.pdf",
		"fileSize": 204800,
		"contentType": "application/pdf",
		"uploadDate": "2025-01-01T10:30:00Z",
		"downloadUrl": "https://storage.blob.core.windows.net/...?sig=..."
	}
]
```

---

### `POST /api/documents`

Uploads a document via `multipart/form-data`.

**Request:**

```
Content-Type: multipart/form-data
Body: file=<binary>
```

**Constraints:**

- Max file size: **100 MB**
- Allowed types: PDF, DOCX, XLSX, JPG, PNG, GIF, TXT, CSV

**Response 201:**

```json
{
	"id": "abc123",
	"fileName": "report.pdf",
	"fileSize": 204800,
	"contentType": "application/pdf",
	"uploadDate": "2025-01-01T10:30:00Z",
	"downloadUrl": "https://storage.blob.core.windows.net/...?sig=...",
	"message": "File uploaded successfully."
}
```

##  Security & Secret Management

DocVault follows Azure-recommended security practices for managing secrets and identity.

### Secrets
- All sensitive values (Azure Storage and Cosmos DB connection strings) are stored in **Azure Key Vault**
- No secrets are committed to the repository
- `appsettings.json` and `appsettings.Development.json` contain only non-sensitive configuration

### Identity & Access
- The backend API runs on **Azure App Service** with **System-Assigned Managed Identity**
- The Managed Identity is granted **Key Vault Secrets User** role on the Key Vault
- The application accesses Key Vault using `DefaultAzureCredential`

### Configuration Flow
1. Application starts
2. `DefaultAzureCredential` authenticates (Managed Identity in Azure, Azure login locally)
3. Configuration is loaded from Azure Key Vault
4. Secrets are resolved automatically via configuration keys

This ensures:
- No credentials in code or config files
- Least-privilege access
- Same code path for local and cloud environments


---

## CI/CD Deployment

### Required GitHub Secrets

| Secret                         | How to Obtain                                              |
| ------------------------------ | ---------------------------------------------------------- |
| `AZURE_WEBAPP_NAME`            | Your App Service name                                      |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Azure Portal → App Service → Get Publish Profile           |
| `ANGULAR_API_BASE_URL`         | Your API URL e.g. `https://your-api.azurewebsites.net/api` |

### Workflow Triggers

| Trigger                      | Action                 |
| ---------------------------- | ---------------------- |
| Push to `main`               | Build + Deploy         |
| Pull Request to `main`       | Build only (no deploy) |
| Manual (`workflow_dispatch`) | Build + Deploy         |

---

## Security Considerations

- **SAS URLs** are generated per-request with a 1-hour TTL — blobs are never publicly accessible
- **Private container** — no anonymous blob access
- **TLS enforced** — HTTPS only on both storage and app service
- **Input validation** — file type whitelist + 100 MB size limit
- **CORS** — restrict `AllowedOrigins` to your production Angular domain
- **Production auth** — replace `GetUserId()` in the controller with JWT claim extraction

---

## Blob Lifecycle Policy

| Tier               | Triggered After                  |
| ------------------ | -------------------------------- |
| **Hot → Cool**     | 30 days since last modification  |
| **Cool → Archive** | 180 days since last modification |

Archived blobs require rehydration before download (~1–15 hours).
Adjust thresholds in `setup-azure.sh` to match your retention needs.

