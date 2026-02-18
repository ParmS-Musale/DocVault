# Day 2 – Security, Identity & Serverless

## 1. Microsoft Entra ID – App Registration

### What I did
- Created a new Entra ID App Registration: `docvault-api`
- Exposed the API and added the scope: `access_as_user`
- Configured the Application ID URI: `api://docvault-api`
- Noted down the TenantId, ClientId, and Audience for backend use

### Why
This is needed so the backend can validate JWT tokens issued by Entra ID.