using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos;

var builder = WebApplication.CreateBuilder(args);

// ===============================
// Azure Services (Day-1 Setup)
// ===============================

// Blob Storage
builder.Services.AddSingleton(_ =>
{
    // TODO (Day-2): Replace with Key Vault + Managed Identity
    var connStr = builder.Configuration["AzureStorage:ConnectionString"];
    return new BlobServiceClient(connStr);
});

// Cosmos DB
builder.Services.AddSingleton(_ =>
{
    // TODO (Day-2): Replace with Key Vault + Managed Identity
    var connStr = builder.Configuration["CosmosDb:ConnectionString"];
    return new CosmosClient(connStr);
});

// ===============================
// Framework Services
// ===============================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ===============================
// Middleware
// ===============================
app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
