var builder = WebApplication.CreateBuilder(args);

// Add services to container
builder.Services.AddControllers();          // Enables Controllers
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
<<<<<<< feat/ui-upload-polish
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientOrigin", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:55813")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
=======
>>>>>>> main

var app = builder.Build();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

<<<<<<< feat/ui-upload-polish
app.UseCors("ClientOrigin");
=======
>>>>>>> main
app.UseAuthorization();

// Map Controllers
app.MapControllers();

app.Run();
