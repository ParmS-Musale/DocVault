var builder = WebApplication.CreateBuilder(args);

// Add services to container
builder.Services.AddControllers();          // Enables Controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientOrigin", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:55813")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("ClientOrigin");
app.UseAuthorization();

// Map Controllers
app.MapControllers();

app.Run();
