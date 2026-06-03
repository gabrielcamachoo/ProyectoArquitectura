# JEE Service

Servicio backend con REST JEE y persistencia local en un archivo JSON.

## Requisitos

- Java 17+
- Maven

## Ejecución

Desde `services/jee-service`:

```bash
mvn package
java -jar target/jee-service-1.0.0.jar
```

El servicio se ejecuta en `http://localhost:8081`.

## Endpoints

- `GET /health`
- `GET /api/courses`
- `GET /api/courses/{id}`
- `POST /api/courses`
- `PUT /api/courses/{id}`
- `DELETE /api/courses/{id}`

La base de datos local está en `services/jee-service/courses.json`.
