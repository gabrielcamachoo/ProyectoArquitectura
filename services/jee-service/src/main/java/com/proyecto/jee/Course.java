package com.proyecto.jee;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Course {
    private int id;
    private String title = "";
    private String description = "";

    public Course() {
    }

    public Course(int id, String title, String description) {
        this.id = id;
        this.title = title;
        this.description = description;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String toJson() {
        return "{\"id\":" + id + ",\"title\":\"" + escapeJson(title) + "\",\"description\":\"" + escapeJson(description) + "\"}";
    }

    public static Course fromJson(String json) {
        if (json == null) {
            throw new IllegalArgumentException("JSON body cannot be null");
        }

        String content = json.trim();
        if (content.startsWith("{")) {
            content = content.substring(1);
        }
        if (content.endsWith("}")) {
            content = content.substring(0, content.length() - 1);
        }

        Course course = new Course();
        Pattern pattern = Pattern.compile("\"(id|title|description)\"\\s*:\\s*(?:\\\"(.*?)\\\"|(\\d+))");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = matcher.group(2) != null ? unescapeJson(matcher.group(2)) : matcher.group(3);
            if (key.equals("id") && value != null) {
                course.setId(Integer.parseInt(value));
            } else if (key.equals("title")) {
                course.setTitle(value != null ? value : "");
            } else if (key.equals("description")) {
                course.setDescription(value != null ? value : "");
            }
        }

        return course;
    }

    private static String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private static String unescapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\\"", "\"").replace("\\\\", "\\").replace("\\n", "\n").replace("\\r", "\r");
    }
}
