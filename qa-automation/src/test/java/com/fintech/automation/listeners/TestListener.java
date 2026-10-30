package com.fintech.automation.listeners;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.MediaEntityBuilder;
import com.aventstack.extentreports.Status;
import com.fasterxml.jackson.databind.JsonNode;
import com.fintech.automation.base.DriverFactory;
import com.fintech.automation.config.ConfigReader;
import com.fintech.automation.utils.ExtentManager;
import com.fintech.automation.utils.ScreenshotUtil;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.WebDriver;
import org.testng.IMethodInstance;
import org.testng.IMethodInterceptor;
import org.testng.ISuite;
import org.testng.ISuiteListener;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

import java.util.Collections;
import java.util.List;

public class TestListener implements ITestListener, ISuiteListener, IMethodInterceptor {
    private static final Logger log = LogManager.getLogger(TestListener.class);
    private static final ThreadLocal<ExtentTest> extentTestThreadLocal = new ThreadLocal<>();

    public static ExtentTest getCurrentTest() {
        return extentTestThreadLocal.get();
    }

    @Override
    public List<IMethodInstance> intercept(List<IMethodInstance> methods, ITestContext context) {
        int xmlTestCount = context.getSuite().getXmlSuite().getTests().size();
        if (xmlTestCount > 1 && ConfigReader.hasCliOverride("browser")) {
            String cliBrowser = System.getProperty("browser").trim();
            String xmlBrowser = context.getCurrentXmlTest().getParameter("browser");
            if (xmlBrowser != null && !xmlBrowser.equalsIgnoreCase(cliBrowser)) {
                log.info("Skipping XML test '{}' (browser={}) because CLI -Dbrowser={} was specified.",
                        context.getCurrentXmlTest().getName(), xmlBrowser, cliBrowser);
                return Collections.emptyList();
            }
        }
        return methods;
    }

    @Override
    public void onStart(ISuite suite) {
        ExtentManager.getInstance();
        log.info("=== Starting Test Suite: {} for Env [{}] ===", suite.getName(), ConfigReader.getProperty("env", "test"));
    }

    @Override
    public void onFinish(ISuite suite) {
        ExtentManager.flushReports();
        log.info("=== Finished Test Suite: {} | Report generated at {} ===",
                suite.getName(), ExtentManager.getReportPath(ConfigReader.getProperty("env", "test")));
    }

    @Override
    public void onTestStart(ITestResult result) {
        ExtentReports extent = ExtentManager.getInstance();
        String methodName = result.getMethod().getMethodName();
        String description = result.getMethod().getDescription();

        Object[] params = result.getParameters();
        if (params != null && params.length > 0 && params[0] instanceof JsonNode node) {
            if (node.has("scenarioName")) {
                methodName = methodName + " [" + node.get("scenarioName").asText() + "]";
            }
        }

        String xmlBrowser = result.getTestContext().getCurrentXmlTest().getParameter("browser");
        String effectiveBrowser = ConfigReader.getBrowser(xmlBrowser).toUpperCase();

        ExtentTest test = extent.createTest(methodName, description != null ? description : "");
        test.assignCategory(effectiveBrowser);
        test.assignCategory(result.getTestClass().getRealClass().getSimpleName());

        // Assign TestNG groups as categories in ExtentReports
        String[] groups = result.getMethod().getGroups();
        if (groups != null) {
            for (String g : groups) {
                test.assignCategory(g.toUpperCase());
            }
        }

        extentTestThreadLocal.set(test);
        log.info("STARTED TEST: {} [Browser={}, Env={}]", methodName, effectiveBrowser, ConfigReader.getProperty("env", "test"));
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        ExtentTest test = extentTestThreadLocal.get();
        if (test != null) {
            test.log(Status.PASS, "Test passed successfully.");
        }
        log.info("PASSED TEST: {}", result.getMethod().getMethodName());
        extentTestThreadLocal.remove();
    }

    @Override
    public void onTestFailure(ITestResult result) {
        String methodName = result.getMethod().getMethodName();
        log.error("FAILED TEST: {}", methodName, result.getThrowable());

        ExtentTest test = extentTestThreadLocal.get();
        if (test != null) {
            WebDriver driver = DriverFactory.getDriver();
            String base64Screenshot = ScreenshotUtil.captureBase64Screenshot(driver);
            ScreenshotUtil.captureScreenshotFile(driver, methodName);

            if (base64Screenshot != null && !base64Screenshot.isEmpty()) {
                test.fail("Failure Screenshot Captured Automatically:",
                        MediaEntityBuilder.createScreenCaptureFromBase64String(
                                base64Screenshot, "Failure_" + methodName
                        ).build());
            }
            test.fail(result.getThrowable());
        }
        extentTestThreadLocal.remove();
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        ExtentTest test = extentTestThreadLocal.get();
        if (test != null) {
            test.log(Status.SKIP, "Test skipped: " +
                    (result.getThrowable() != null ? result.getThrowable().getMessage() : ""));
        }
        extentTestThreadLocal.remove();
    }

    @Override
    public void onFinish(ITestContext context) {
        ExtentManager.flushReports();
    }
}
