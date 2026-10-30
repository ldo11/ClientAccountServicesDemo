package com.fintech.automation.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public final class JsonDataReader {
    private static final ObjectMapper mapper = new ObjectMapper();

    private JsonDataReader() {
    }

    public static JsonNode readJsonResource(String resourcePath) {
        try (InputStream is = JsonDataReader.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new IllegalArgumentException("JSON test data file not found on classpath: " + resourcePath);
            }
            return mapper.readTree(is);
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse JSON resource: " + resourcePath, e);
        }
    }

    public static Object[][] getArrayAsDataProvider(String resourcePath, String arrayFieldName) {
        JsonNode root = readJsonResource(resourcePath);
        JsonNode arrayNode = root.get(arrayFieldName);
        if (arrayNode == null || !arrayNode.isArray()) {
            throw new IllegalArgumentException("Field '" + arrayFieldName + "' is missing or not a JSON array in " + resourcePath);
        }
        List<Object[]> rows = new ArrayList<>();
        for (JsonNode item : arrayNode) {
            rows.add(new Object[]{item});
        }
        return rows.toArray(new Object[0][]);
    }
}
