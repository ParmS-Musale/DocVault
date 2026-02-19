#!/bin/bash
# ---------------------------------------------------------
# DocVault – Day 1 Infrastructure 
#
# Purpose:
# This script provisions the foundational Azure resources
# required to start the DocVault project development.
#
# Resources Created:
# - Azure Resource Group
# - Azure Blob Storage account with:
#     • uploads container
#     • thumbnails container
# - Azure Cosmos DB (Serverless)
#     • SQL database
#     • documents container with /userId partition key
#
# Why This Exists:
# Day 1 focuses on enabling core storage and metadata
# persistence so the backend API and Angular UI teams
# can immediately begin implementing upload and listing
# features.    
#
# Notes:
# - Storage and Cosmos account names are globally unique.
# - Security (Key Vault, Managed Identity) is intentionally
#   excluded and will be added on Day 2.
# - This script is idempotent only for new resource names.
# - Run after logging in with: az login
#
# Environment: Azure CLI
# ---------------------------------------------------------

LOCATION="centralindia"
RESOURCE_GROUP="docvault-rg"

# Storage account names must be globally unique
STORAGE_ACCOUNT="docvaultstorage$RANDOM"

# Cosmos DB account names are globally unique 
COSMOS_ACCOUNT="docvault-cosmos-$RANDOM"

DATABASE_NAME="docvault-db"
CONTAINER_NAME="documents"
PARTITION_KEY="/userId"

echo "Step 1/5: Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

echo "Step 2/5: Creating storage account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

echo "Fetching storage account key..."
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" -o tsv)

echo "Creating blob containers..."
az storage container create \
  --name uploads \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

az storage container create \
  --name thumbnails \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

echo "Step 3/5: Creating Cosmos DB account (serverless)..."
az cosmosdb create \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --locations regionName=$LOCATION \
  --capabilities EnableServerless

echo "Step 4/5: Creating Cosmos DB database..."
az cosmosdb sql database create \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --name $DATABASE_NAME

echo "Step 5/5: Creating Cosmos DB container..."
az cosmosdb sql container create \
  --account-name docvault-cosmos-10342 \
  --resource-group docvault-rg \
  --database-name docvault-db \
  --name documents \
  --partition-key-path '/userId'

echo "Day 1 infrastructure setup completed successfully ✅"
