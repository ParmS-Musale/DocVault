var builder = WebApplication.CreateBuilder(args);

// Add services to container
builder.Services.AddControllers();          // Enables Controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// Map Controllers
app.MapControllers();

app.Run();
