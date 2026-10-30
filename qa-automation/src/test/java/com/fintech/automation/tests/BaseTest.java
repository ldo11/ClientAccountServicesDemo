package com.fintech.automation.tests;

import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.fintech.automation.api.ClientApiHelper;
import com.fintech.automation.api.ClientApiHelper.ProvisionedClient;
import com.fintech.automation.base.DriverFactory;
import com.fintech.automation.config.ConfigReader;
import com.fintech.automation.listeners.TestListener;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Optional;
import org.testng.annotations.Parameters;

import java.util.ArrayList;
import java.util.List;

public abstract class BaseTest {
    protected final Logger log = LogManager.getLogger(getClass());
    private static final ThreadLocal<List<ProvisionedClient>> provisionedClientsThreadLocal =
            ThreadLocal.withInitial(ArrayList::new);

    @BeforeMethod(alwaysRun = true)
    @Parameters({"browser"})
    public void setUp(@Optional("") String xmlBrowser) {
        String targetBrowser = ConfigReader.getBrowser(xmlBrowser);
        DriverFactory.initDriver(targetBrowser);
    }

    protected WebDriver getDriver() {
        return DriverFactory.getDriver();
    }

    protected void registerClientForTeardown(ProvisionedClient client) {
        if (client != null) {
            provisionedClientsThreadLocal.get().add(client);
        }
    }

    protected void logStep(String message) {
        log.info(message);
        ExtentTest test = TestListener.getCurrentTest();
        if (test != null) {
            test.log(Status.INFO, message);
        }
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown() {
        try {
            List<ProvisionedClient> clients = provisionedClientsThreadLocal.get();
            for (ProvisionedClient client : clients) {
                try {
                    ClientApiHelper.deleteClientViaApi(client.getToken(), client.getClientId());
                } catch (Exception e) {
                    log.warn("Failed to clean up client {}: {}", client.getClientId(), e.getMessage());
                }
            }
        } finally {
            provisionedClientsThreadLocal.remove();
            DriverFactory.quitDriver();
        }
    }
}
