# Day 2 – Security, Identity & Serverless

## 1. Microsoft Entra ID – App Registration

- Created a new Entra ID App Registration: `docvault-api`
- Exposed the API and added the scope: `access_as_user`
- Configured the Application ID URI: `api://docvault-api`
- Noted down the TenantId, ClientId, and Audience for backend use


## 2. JWT Authentication in .NET API

- Added JWT Bearer authentication to the backend API
- Configured:
  - Authority → Entra ID
  - Audience → App ID URI
- Secured all controllers using `[Authorize]`
- Verified that:
  - API returns 401 for unauthenticated requests
  - Swagger UI is protected and requires authentication


## 3. Move secrets to Key Vault and enable Managed Identity

- Created Azure Key Vault to store application secrets
- Moved storage connection string and Cosmos DB settings to Key Vault
- Removed secrets from appsettings.json and local config files
- Enabled System-Assigned Managed Identity on App Service
- Updated the API to use DefaultAzureCredential

