using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<JsonCourseStore>();
builder.Services.AddCors();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());

app.MapGet("/health", () => Results.Ok(new { service = "dotnet-service", status = "ok" }));
app.MapGet("/courses", (JsonCourseStore store) => Results.Ok(store.GetAll()));
app.MapGet("/courses/{id}", (int id, JsonCourseStore store) => store.TryGet(id, out var course) ? Results.Ok(course) : Results.NotFound());
app.MapPost("/courses", (Course course, JsonCourseStore store) => {
    var created = store.Add(course);
    return Results.Created($"/courses/{created.Id}", created);
});
app.MapPut("/courses/{id}", (int id, Course updated, JsonCourseStore store) => store.Update(id, updated) ? Results.NoContent() : Results.NotFound());
app.MapDelete("/courses/{id}", (int id, JsonCourseStore store) => store.Delete(id) ? Results.NoContent() : Results.NotFound());

app.Run();
