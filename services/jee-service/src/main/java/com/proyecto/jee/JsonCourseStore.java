package com.proyecto.jee;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

public class JsonCourseStore {
    private static final Path DATA_FILE = Path.of("courses.json");
    private static final JsonCourseStore INSTANCE = new JsonCourseStore();
    private final ReentrantLock lock = new ReentrantLock();
    private List<Course> courses = new ArrayList<>();

    private JsonCourseStore() {
        load();
    }

    public static JsonCourseStore getInstance() {
        return INSTANCE;
    }

    private void load() {
        lock.lock();
        try {
            if (Files.notExists(DATA_FILE)) {
                courses = new ArrayList<>();
                courses.add(new Course(1, "Introducción a JEE", "Servicio JEE con persistencia local en JSON."));
                save();
                return;
            }
            String text = Files.readString(DATA_FILE);
            if (text.isBlank()) {
                courses = new ArrayList<>();
            } else {
                courses = parseCourses(text);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error leyendo courses.json", e);
        } finally {
            lock.unlock();
        }
    }

    private void save() {
        lock.lock();
        try {
            Files.writeString(DATA_FILE, toJson(courses));
        } catch (IOException e) {
            throw new RuntimeException("Error guardando courses.json", e);
        } finally {
            lock.unlock();
        }
    }

    public static String toJson(List<Course> courses) {
        return "[" + courses.stream().map(Course::toJson).collect(Collectors.joining(",")) + "]";
    }

    private static List<Course> parseCourses(String text) {
        String content = text.trim();
        if (content.startsWith("[")) {
            content = content.substring(1);
        }
        if (content.endsWith("]")) {
            content = content.substring(0, content.length() - 1);
        }

        List<Course> result = new ArrayList<>();
        int depth = 0;
        int start = 0;
        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '{') {
                if (depth == 0) {
                    start = i;
                }
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    result.add(Course.fromJson(content.substring(start, i + 1)));
                }
            }
        }
        return result;
    }

    public List<Course> findAll() {
        lock.lock();
        try {
            return new ArrayList<>(courses);
        } finally {
            lock.unlock();
        }
    }

    public Optional<Course> findById(int id) {
        lock.lock();
        try {
            return courses.stream().filter(course -> course.getId() == id).findFirst();
        } finally {
            lock.unlock();
        }
    }

    public Course add(Course course) {
        lock.lock();
        try {
            int nextId = courses.stream().mapToInt(Course::getId).max().orElse(0) + 1;
            course.setId(nextId);
            courses.add(course);
            save();
            return course;
        } finally {
            lock.unlock();
        }
    }

    public boolean update(int id, Course updated) {
        lock.lock();
        try {
            Optional<Course> existing = courses.stream().filter(course -> course.getId() == id).findFirst();
            if (existing.isEmpty()) {
                return false;
            }
            Course course = existing.get();
            course.setTitle(updated.getTitle());
            course.setDescription(updated.getDescription());
            save();
            return true;
        } finally {
            lock.unlock();
        }
    }

    public boolean delete(int id) {
        lock.lock();
        try {
            boolean removed = courses.removeIf(course -> course.getId() == id);
            if (removed) {
                save();
            }
            return removed;
        } finally {
            lock.unlock();
        }
    }
}
