package com.fintech.automation.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class ScreenshotUtil {
    private static final Logger log = LogManager.getLogger(ScreenshotUtil.class);
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS");

    private ScreenshotUtil() {
    }

    public static String captureBase64Screenshot(WebDriver driver) {
        if (driver == null) {
            return null;
        }
        try {
            return ((TakesScreenshot) driver).getScreenshotAs(OutputType.BASE64);
        } catch (Exception e) {
            log.warn("Unable to capture Base64 screenshot: {}", e.getMessage());
            return null;
        }
    }

    public static String captureScreenshotFile(WebDriver driver, String testName) {
        if (driver == null) {
            return null;
        }
        try {
            File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            String safeName = testName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = safeName + "_" + LocalDateTime.now().format(TS_FORMAT) + ".png";
            Path destDir = Path.of("target", "extent-reports", "screenshots");
            Files.createDirectories(destDir);
            Path destPath = destDir.resolve(fileName);
            Files.copy(srcFile.toPath(), destPath, StandardCopyOption.REPLACE_EXISTING);
            return destPath.toString();
        } catch (IOException e) {
            log.warn("Unable to save screenshot file: {}", e.getMessage());
            return null;
        }
    }
}
