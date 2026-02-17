LOCATION="centralindia"
RESOURCE_GROUP="docvault-rg"

# Storage account names must be globally unique
STORAGE_ACCOUNT="docvaultstorage$RANDOM"

# Cosmos DB account names are globally unique as well
COSMOS_ACCOUNT="docvault-cosmos-$RANDOM"

echo "Step 1/3: Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

echo "Step 2/3: Creating storage account..."
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

echo "Step 3/3: Creating Cosmos DB account (serverless)..."
az cosmosdb create \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --locations regionName=$LOCATION \
  --capabilities EnableServerless