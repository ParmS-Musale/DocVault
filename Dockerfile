# Multi-stage build for DocVault.API
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/DocVault.API/DocVault.API.csproj", "backend/DocVault.API/"]
RUN dotnet restore "backend/DocVault.API/DocVault.API.csproj"
COPY . .
WORKDIR "/src/backend/DocVault.API"
RUN dotnet build "DocVault.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "DocVault.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DocVault.API.dll"]
