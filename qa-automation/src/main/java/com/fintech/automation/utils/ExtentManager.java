package com.fintech.automation.utils;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import com.fintech.automation.config.ConfigReader;

import java.io.File;
import java.util.concurrent.ConcurrentHashMap;

public final class ExtentManager {
    private static final ConcurrentHashMap<String, ExtentReports> reportsMap = new ConcurrentHashMap<>();

    private ExtentManager() {
    }

    public static String getReportPath(String env) {
        String cleanEnv = (env == null || env.isBlank()) ? ConfigReader.getProperty("env", "test").toLowerCase() : env.trim().toLowerCase();
        return "target/reports/ExtentReport-" + cleanEnv + ".html";
    }

    public static synchronized ExtentReports getInstance() {
        String env = ConfigReader.getProperty("env", "test").toLowerCase();
        return reportsMap.computeIfAbsent(env, (e) -> {
            String reportPath = getReportPath(e);
            File reportFile = new File(reportPath);
            File parentDir = reportFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }

            ExtentSparkReporter sparkReporter = new ExtentSparkReporter(reportFile);
            sparkReporter.config().setTheme(Theme.DARK);
            sparkReporter.config().setDocumentTitle("FinTech [" + e.toUpperCase() + "] Execution Report");
            sparkReporter.config().setReportName("Charlotte FinTech Core Banking - " + e.toUpperCase() + " Test Suite");
            sparkReporter.config().setTimeStampFormat("yyyy-MM-dd HH:mm:ss z");
            sparkReporter.config().setEncoding("UTF-8");

            ExtentReports extent = new ExtentReports();
            extent.attachReporter(sparkReporter);

            extent.setSystemInfo("Application", "Charlotte FinTech Core Banking System");
            extent.setSystemInfo("Environment", e.toUpperCase());
            extent.setSystemInfo("API Base URL", ConfigReader.getApiBaseUrl());
            extent.setSystemInfo("UI Base URL", ConfigReader.getUiBaseUrl());
            extent.setSystemInfo("Headless Mode", String.valueOf(ConfigReader.isHeadless()));
            extent.setSystemInfo("OS", System.getProperty("os.name") + " (" + System.getProperty("os.arch") + ")");
            extent.setSystemInfo("Java Version", System.getProperty("java.version"));
            return extent;
        });
    }

    public static synchronized void flushReports() {
        for (ExtentReports extent : reportsMap.values()) {
            extent.flush();
        }
    }
}
