# .NET Service

Servicio backend simple con almacenamiento local en JSON.

## Requisitos

- .NET 8 SDK instalado

## Ejecución

Desde la carpeta raíz del proyecto:

```bash
cd services/dotnet-service
dotnet run --project DotnetService.csproj
```

El servicio se ejecuta en `http://localhost:5000`.

## Endpoints

- `GET /health`
- `GET /courses`
- `GET /courses/{id}`
- `POST /courses`
- `PUT /courses/{id}`
- `DELETE /courses/{id}`

El almacenamiento local se mantiene en `services/dotnet-service/courses.json`.
