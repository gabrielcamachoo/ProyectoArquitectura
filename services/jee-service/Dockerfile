FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app
COPY --from=build /app/target/jee-service-1.0.0.jar ./jee-service.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "jee-service.jar"]
