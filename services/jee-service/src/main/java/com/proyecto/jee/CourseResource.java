package com.proyecto.jee;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/courses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CourseResource {
    private final JsonCourseStore store = JsonCourseStore.getInstance();

    @GET
    public Response listCourses() {
        return Response.ok(JsonCourseStore.toJson(store.findAll()), MediaType.APPLICATION_JSON).build();
    }

    @GET
    @Path("/{id}")
    public Response getCourse(@PathParam("id") int id) {
        return store.findById(id)
                .map(course -> Response.ok(course.toJson(), MediaType.APPLICATION_JSON).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    public Response createCourse(String body) {
        Course course = Course.fromJson(body);
        Course created = store.add(course);
        return Response.status(Response.Status.CREATED).entity(created.toJson()).type(MediaType.APPLICATION_JSON).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateCourse(@PathParam("id") int id, String body) {
        Course course = Course.fromJson(body);
        return store.update(id, course)
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteCourse(@PathParam("id") int id) {
        return store.delete(id)
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }
}
