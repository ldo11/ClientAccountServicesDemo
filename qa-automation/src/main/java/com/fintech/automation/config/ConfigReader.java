package com.fintech.automation.config;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Properties;

public final class ConfigReader {
    private static final Logger log = LogManager.getLogger(ConfigReader.class);
    private static final Properties properties = new Properties();
    private static volatile String resolvedUiBaseUrl;

    static {
        try (InputStream is = ConfigReader.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (is != null) {
                properties.load(is);
            } else {
                log.warn("config.properties not found on classpath; relying on defaults/CLI overrides.");
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load config.properties", e);
        }
    }

    private ConfigReader() {
    }

    public static String getProperty(String key, String defaultValue) {
        String sysVal = System.getProperty(key);
        if (sysVal != null && !sysVal.trim().isEmpty()) {
            return sysVal.trim();
        }
        String propVal = properties.getProperty(key);
        if (propVal != null && !propVal.trim().isEmpty()) {
            return propVal.trim();
        }
        return defaultValue;
    }

    public static boolean hasCliOverride(String key) {
        String sysVal = System.getProperty(key);
        return sysVal != null && !sysVal.trim().isEmpty();
    }

    public static String getApiBaseUrl() {
        return getProperty("api.base.url", "http://localhost:5000/api");
    }

    public static String getUiBaseUrl() {
        if (hasCliOverride("ui.base.url")) {
            return System.getProperty("ui.base.url").trim();
        }
        if (resolvedUiBaseUrl != null) {
            return resolvedUiBaseUrl;
        }
        synchronized (ConfigReader.class) {
            if (resolvedUiBaseUrl != null) {
                return resolvedUiBaseUrl;
            }
            String configuredUrl = properties.getProperty("ui.base.url", "http://localhost:3000").trim();
            if (isFinTechPortalReachable(configuredUrl)) {
                resolvedUiBaseUrl = configuredUrl;
                return resolvedUiBaseUrl;
            }
            // Fallback check if Vite automatically shifted from 3000 -> 3001 locally
            if (configuredUrl.contains(":3000")) {
                String fallbackUrl = configuredUrl.replace(":3000", ":3001");
                if (isFinTechPortalReachable(fallbackUrl)) {
                    log.info("Port 3000 occupied by another process; auto-resolved FinTech UI at {}", fallbackUrl);
                    resolvedUiBaseUrl = fallbackUrl;
                    return resolvedUiBaseUrl;
                }
            }
            resolvedUiBaseUrl = configuredUrl;
            return resolvedUiBaseUrl;
        }
    }

    private static boolean isFinTechPortalReachable(String url) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .connectTimeout(Duration.ofSeconds(2))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "text/html,application/xhtml+xml,*/*")
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200
                    && response.body() != null
                    && response.body().contains("Charlotte FinTech Banking Portal");
        } catch (Exception ignored) {
            return false;
        }
    }

    public static String getBrowser(String xmlBrowserParam) {
        if (hasCliOverride("browser")) {
            return System.getProperty("browser").trim().toLowerCase();
        }
        if (xmlBrowserParam != null && !xmlBrowserParam.trim().isEmpty()) {
            return xmlBrowserParam.trim().toLowerCase();
        }
        return getProperty("browser", "chrome").toLowerCase();
    }

    public static boolean isHeadless() {
        return Boolean.parseBoolean(getProperty("headless", "true"));
    }

    public static int getExplicitWaitSeconds() {
        return Integer.parseInt(getProperty("explicit.wait.seconds", "10"));
    }
}
