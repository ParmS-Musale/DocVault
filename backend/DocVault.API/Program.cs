using Azure.Identity;
using Microsoft.Extensions.Configuration;
using DocVault.API.Configuration;
using DocVault.API.Interfaces;
using DocVault.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

Console.WriteLine("DocVault API Starting...");

var builder = WebApplication.CreateBuilder(args);

// Azure Key Vault setup (Managed Identity)

if (!builder.Environment.IsDevelopment())
{
    var keyVaultUri = new Uri("https://docvault-kv-prajwal.vault.azure.net/");
    builder.Configuration.AddAzureKeyVault(
        keyVaultUri,
        new DefaultAzureCredential()
    );
}

// ── Configuration ──────────────────────────────────────────────────────────────
builder.Services.Configure<AzureStorageOptions>(
    builder.Configuration.GetSection(AzureStorageOptions.SectionName));
builder.Services.Configure<CosmosDbOptions>(
    builder.Configuration.GetSection(CosmosDbOptions.SectionName));

// ── Azure Services ─────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IBlobStorageService, BlobStorageService>();
builder.Services.AddSingleton<ICosmosDbService, CosmosDbService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();

// ── ASP.NET Core ───────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "DocVault API", Version = "v1" });

    // Define the OAuth2.0 scheme that's in use (i.e., Implicit Flow)
    // or just a generic "Bearer" scheme if we just want to paste the token.
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// ── JWT Authentication (Entra ID) ──────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var azureAd = builder.Configuration.GetSection("AzureAd");

        options.Authority = $"{azureAd["Instance"]}{azureAd["TenantId"]}/v2.0";

        var audience = azureAd["Audience"];
        var clientId = azureAd["ClientId"];
        
        Console.WriteLine($"🔍 AzureAd Config - Instance: {azureAd["Instance"]}");
        Console.WriteLine($"🔍 AzureAd Config - TenantId: {azureAd["TenantId"]}");
        Console.WriteLine($"🔍 AzureAd Config - Audience: {audience}");
        Console.WriteLine($"🔍 AzureAd Config - ClientId: {clientId}");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            // Validate against both the App ID URI and the Client ID to cover different token issuance patterns
            ValidAudiences = new[] { audience, clientId, $"api://{clientId}" }.Where(x => !string.IsNullOrEmpty(x)),
            ValidateLifetime = true
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"❌ Authentication Failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("✅ Token Validated Successfully");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"⚠️ Authentication Challenge: {context.Error}, {context.ErrorDescription}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS – allow Angular dev server and deployed URL ──────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("DocVaultCors", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:4200"])
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ── Middleware Pipeline ─────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("DocVaultCors");
app.UseAuthentication(); 
app.UseAuthorization();
app.MapControllers();

app.Run();

