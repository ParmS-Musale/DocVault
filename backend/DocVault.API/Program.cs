using DocVault.API.Configuration;
using DocVault.API.Interfaces;
using DocVault.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Services ─────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DocVault API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Authorization: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── Configuration ────────────────────────────────────────
builder.Services.Configure<AzureStorageOptions>(
    builder.Configuration.GetSection(AzureStorageOptions.SectionName));

builder.Services.Configure<CosmosDbOptions>(
    builder.Configuration.GetSection(CosmosDbOptions.SectionName));

builder.Services.Configure<EventGridOptions>(
    builder.Configuration.GetSection(EventGridOptions.SectionName));

builder.Services.Configure<ServiceBusOptions>(
    builder.Configuration.GetSection(ServiceBusOptions.SectionName));

// ── Custom Services ──────────────────────────────────────
builder.Services.AddSingleton<IBlobStorageService, BlobStorageService>();
builder.Services.AddSingleton<ICosmosDbService, CosmosDbService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IEventService, EventService>();

// ── Application Insights ─────────────────────────────────
var appInsightsConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
if (!string.IsNullOrEmpty(appInsightsConnectionString))
{
    builder.Services.AddApplicationInsightsTelemetry();
}

// ── JWT Authentication ───────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var azureAd = builder.Configuration.GetSection("AzureAd");

        var tenantId = azureAd["TenantId"];
        var instance = azureAd["Instance"];

        options.Authority = $"{instance}{tenantId}/v2.0";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,

            ValidAudiences = new[]
            {
                azureAd["Audience"],
                azureAd["ClientId"]
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS ─────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("DocVaultCors", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:4200" })
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ── Middleware ───────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("DocVaultCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
