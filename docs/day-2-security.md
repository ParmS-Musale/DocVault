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