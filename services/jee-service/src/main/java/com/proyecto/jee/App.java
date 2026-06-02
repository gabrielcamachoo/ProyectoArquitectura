package com.proyecto.jee;

import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;

import java.net.URI;

public class App {
    public static final String BASE_URI = "http://0.0.0.0:8081/";

    public static void main(String[] args) {
        ResourceConfig config = new ResourceConfig()
                .register(HealthResource.class)
                .register(CourseResource.class);

        HttpServer server = GrizzlyHttpServerFactory.createHttpServer(URI.create(BASE_URI), config);
        System.out.println("JEE service running at " + BASE_URI);

        Runtime.getRuntime().addShutdownHook(new Thread(server::shutdownNow));

        try {
            Thread.currentThread().join();
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
