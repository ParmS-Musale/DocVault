using DocVault.API.Configuration;
using DocVault.API.Interfaces;
using DocVault.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;


var builder = WebApplication.CreateBuilder(args);

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
});

// ── JWT Authentication (Entra ID) ──────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var azureAd = builder.Configuration.GetSection("AzureAd");

        options.Authority =
            $"{azureAd["Instance"]}{azureAd["TenantId"]}/v2.0";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = azureAd["Audience"],
            ValidateLifetime = true
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

