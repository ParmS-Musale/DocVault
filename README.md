# DocVault

DocVault is a minimal ASP.NET Core Web API for document upload and basic health checks. It exposes simple endpoints to verify the API and upload files to a local folder.

## Features
- Health endpoint to confirm the API is running
- Basic documents endpoint placeholder
- File upload via multipart/form-data to an Uploads folder
- Swagger/OpenAPI UI enabled in Development

## Prerequisites
- .NET SDK 8.0

## Getting Started
1. Restore dependencies:

```bash
dotnet restore
```

2. Run the API:

```bash
dotnet run --project DocVault.API
```

3. Open Swagger UI (Development only):
- https://localhost:7120/swagger
- http://localhost:5055/swagger

## API Endpoints
- GET /api/documents/health — returns API health status
- GET /api/documents — sample endpoint to confirm routing
- POST /api/documents/upload — uploads a file (multipart/form-data, field name: file)

## Examples
Health:

```bash
curl -X GET https://localhost:7120/api/documents/health
```

Upload (replace path with your file):

```bash
curl -X POST https://localhost:7120/api/documents/upload \
  -F "file=@C:/path/to/your/file.pdf"
```

## Storage
- Uploaded files are saved to DocVault.API/Uploads
- Folder is created automatically if it does not exist

## Project Structure
- DocVault.API — ASP.NET Core Web API project
  - Controllers/DocumentsController.cs — upload, health, and sample endpoints
  - Program.cs — service and pipeline setup
  - Properties/launchSettings.json — local URLs and profiles
  - appsettings.json — basic configuration

## Notes
- Swagger UI is available only when ASPNETCORE_ENVIRONMENT=Development
- CI is pre-configured with a placeholder workflow under .github/workflows/ci.yml

## Code References
- [Program.cs](file:///c:/Users/Parm's%20Musale/OneDrive/Desktop/DocVault/DocVault.API/Program.cs)
- [DocumentsController.cs](file:///c:/Users/Parm's%20Musale/OneDrive/Desktop/DocVault/DocVault.API/Controllers/DocumentsController.cs)
- [launchSettings.json](file:///c:/Users/Parm's%20Musale/OneDrive/Desktop/DocVault/DocVault.API/Properties/launchSettings.json)
# DocVault — Secure Document Management Platform

> **AZ-204 Capstone Project** | Angular + .NET 8 | 4-Day Sprint

DocVault is an internal document management platform where employees can upload, search, and download files. Every Azure service used has a genuine architectural reason — the goal is to wire real Azure services together and be able to explain every decision.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Azure Services](#azure-services)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables & Secrets](#environment-variables--secrets)
- [Running the App Locally](#running-the-app-locally)
- [Git & Branching Workflow](#git--branching-workflow)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Endpoints](#api-endpoints)

---

## Azure Services

| Service | Purpose in DocVault ||
|---|---|---|
| Azure App Service | Hosts the .NET 8 Web API and Angular SPA 
| Azure Blob Storage | Stores uploaded documents and generated thumbnails |
| Azure Cosmos DB | Stores document metadata, tags, and audit logs (NoSQL) | 
| Azure Functions | Blob-triggered function for PDF thumbnail generation and text extraction | 
| Microsoft Entra ID | Authenticates users via MSAL; protects API with bearer tokens | 
| Azure Key Vault | Stores Cosmos DB keys, Storage connection strings, and third-party API keys | 
| Managed Identity | Allows App Service and Functions to access Key Vault and Storage without secrets in code | 
| Application Insights | API and Functions telemetry, custom metrics, availability tests |
| Azure API Management | Exposes the .NET API with rate-limiting and caching policies |
| Azure Event Grid | Publishes events when documents are uploaded or processed |
| Azure Service Bus | Reliable job queuing for document processing tasks | 
| Azure Container Apps | Optional containerised deployment with auto-scaling | 

---

## Prerequisites

Before writing any code, make sure every team member has the following installed and configured.

**Tooling**
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- [Angular CLI](https://angular.io/cli) — `npm install -g @angular/cli`
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Git](https://git-scm.com/)

**Azure Access**
- An active Azure subscription with Contributor access
- Permissions to register an app in Microsoft Entra ID
- Access to the shared Azure resource group for this project

**IDE**
- Visual Studio 2022 or VS Code with the C# Dev Kit and Azure extensions

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/docvault.git
cd docvault
```

### 2. Install API dependencies

```bash
cd src/DocVault.API
dotnet restore
```

### 3. Install Angular dependencies

```bash
cd client
npm install
```

### 4. Configure local secrets

**Never commit secrets.** Copy the example config and fill in your values:

```bash
# For the API
cp src/DocVault.API/appsettings.Example.json src/DocVault.API/appsettings.Development.json

# For Azure Functions
cp src/DocVault.Functions/local.settings.Example.json src/DocVault.Functions/local.settings.json
```

Then open each file and replace the placeholder values with your actual connection strings and keys. See [Environment Variables & Secrets](#environment-variables--secrets) for the full list.

---

## Environment Variables & Secrets

**These files are git-ignored. Never commit them.**

`appsettings.Development.json` (API)

```json
{
  "AzureAd": {
    "TenantId": "<your-tenant-id>",
    "ClientId": "<your-client-id>"
  },
  "KeyVault": {
    "Uri": "https://<your-keyvault-name>.vault.azure.net/"
  },
  "ApplicationInsights": {
    "ConnectionString": "<your-app-insights-connection-string>"
  }
}
```

`local.settings.json` (Azure Functions)

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "<your-storage-connection-string>",
    "BlobContainerName": "documents",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated"
  }
}
```

In production, all secrets are stored in **Azure Key Vault** and accessed via **Managed Identity** — no connection strings in application code or environment variables on the server.

---

## Running the App Locally

### Start the API

```bash
cd src/DocVault.API
dotnet run
# API available at https://localhost:7001
```

### Start Azure Functions

```bash
cd src/DocVault.Functions
func start
```

### Start the Angular app

```bash
cd client
ng serve
# App available at http://localhost:4200
```

### Run tests

```bash
# API unit tests
cd src/DocVault.Tests
dotnet test

# Angular unit tests
cd client
ng test
```

---

## Git & Branching Workflow

This project follows a strict branching strategy. Reviewers will check the commit history and PR trail during the demo evaluation.

### Branches

| Branch | Purpose |
|---|---|
| `main` | Protected. Production-ready code only. No direct pushes. |
| `dev` | Integration branch. All features merge here first. |
| `feature/<name>` | Short-lived branch per task (e.g. `feature/upload-api`, `feature/entra-auth`). |

### Commit Rules

- Commit every time you finish a logical unit of work (a working endpoint, a component, a config change). **Aim for 5+ commits per person per day.**
- Use the format: `type(scope): description`
  - `feat(api): add upload endpoint with blob storage`
  - `fix(auth): correct MSAL redirect URI`
  - `chore(infra): add Key Vault resource to setup script`
- **Never commit secrets.** Use environment variables or Key Vault.
- **Never push directly to `main` or `dev`.**

### Pull Request Rules

- Every feature branch requires a PR to merge into `dev`. No exceptions.
- At least one team member must review and approve before merging.
- Every PR description must answer three questions:
  1. What does this change?
  2. Which Azure service does it touch?
  3. How do I test it?
- Keep PRs small — if a feature is large, split it (e.g. API endpoint first, then the Angular component).
- Resolve merge conflicts on your feature branch before requesting review.

---

## CI/CD Pipeline

Two GitHub Actions workflows run automatically. **A failing CI check blocks the PR from merging.**

### `ci.yml` — triggered on every PR to `dev` and `main`

1. Checkout code
2. `dotnet restore` + `dotnet build` + `dotnet test`
3. `npm install` + `ng build`
4. Report status back to the PR

### `deploy.yml` — triggered on push to `main` only

1. Run all CI steps
2. Publish the .NET API
3. Build the Angular app for production
4. Deploy API to Azure App Service
5. Deploy Angular to Azure Static Web Apps

Azure credentials are stored as **GitHub Secrets** (`AZURE_PUBLISH_PROFILE`). They are never hardcoded.

---

## API Endpoints

> This section will be filled in as endpoints are built. Add your endpoint here when you raise the PR.

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/documents` | Upload a document | Yes |
| `GET` | `/api/documents` | List/search documents | Yes |
| `GET` | `/api/documents/{id}` | Get document metadata | Yes |
| `GET` | `/api/documents/{id}/download` | Download document file | Yes |
| `DELETE` | `/api/documents/{id}` | Delete a document | Yes |

---

## Notes

- The goal is not pixel-perfect UI — the goal is correctly wired Azure services that you can explain.
- Every architectural decision should have an answer to: *"Why this service and not something else?"*
- If you're unsure where a secret should go, the answer is always **Key Vault**.