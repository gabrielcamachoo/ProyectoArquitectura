using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.Extensions.Hosting;

public class JsonCourseStore
{
    private readonly string filePath;
    private readonly object sync = new();
    private List<Course> courses = new();

    public JsonCourseStore(IHostEnvironment environment)
    {
        filePath = Path.Combine(environment.ContentRootPath, "courses.json");
        Load();
    }

    private void Load()
    {
        lock (sync)
        {
            if (!File.Exists(filePath))
            {
                courses = new List<Course>
                {
                    new Course
                    {
                        Id = 1,
                        Title = "Introducción a .NET",
                        Description = "Curso inicial con almacenamiento JSON local."
                    }
                };
                Save();
                return;
            }

            var json = File.ReadAllText(filePath);
            if (string.IsNullOrWhiteSpace(json))
            {
                courses = new List<Course>();
                return;
            }

            courses = JsonSerializer.Deserialize<List<Course>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<Course>();
        }
    }

    private void Save()
    {
        lock (sync)
        {
            File.WriteAllText(filePath, JsonSerializer.Serialize(courses, new JsonSerializerOptions { WriteIndented = true }));
        }
    }

    public IEnumerable<Course> GetAll()
    {
        lock (sync)
        {
            return courses.Select(c => new Course { Id = c.Id, Title = c.Title, Description = c.Description }).ToList();
        }
    }

    public bool TryGet(int id, out Course? course)
    {
        lock (sync)
        {
            course = courses.FirstOrDefault(c => c.Id == id);
            return course is not null;
        }
    }

    public Course Add(Course course)
    {
        lock (sync)
        {
            var nextId = courses.Any() ? courses.Max(c => c.Id) + 1 : 1;
            course.Id = nextId;
            courses.Add(course);
            Save();
            return course;
        }
    }

    public bool Update(int id, Course updated)
    {
        lock (sync)
        {
            var existing = courses.FirstOrDefault(c => c.Id == id);
            if (existing is null)
            {
                return false;
            }

            existing.Title = updated.Title;
            existing.Description = updated.Description;
            Save();
            return true;
        }
    }

    public bool Delete(int id)
    {
        lock (sync)
        {
            var existing = courses.FirstOrDefault(c => c.Id == id);
            if (existing is null)
            {
                return false;
            }

            courses.Remove(existing);
            Save();
            return true;
        }
    }
}
