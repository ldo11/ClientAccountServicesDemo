package com.fintech.automation.pages;

import com.fintech.automation.config.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePage {
    private static final By USERNAME_INPUT = By.id("login-username");
    private static final By PASSWORD_INPUT = By.id("login-password");
    private static final By LOGIN_SUBMIT_BTN = By.id("login-submit-btn");
    private static final By LOGIN_ERROR_MSG = By.id("login-error-msg");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public LoginPage open() {
        driver.get(ConfigReader.getUiBaseUrl() + "/login");
        waitForVisibility(USERNAME_INPUT);
        return this;
    }

    public AccountsListPage loginAs(String username, String password) {
        sendKeys(USERNAME_INPUT, username);
        sendKeys(PASSWORD_INPUT, password);
        clickElement(LOGIN_SUBMIT_BTN);
        return new AccountsListPage(driver);
    }

    public LoginPage submitInvalidCredentials(String username, String password) {
        sendKeys(USERNAME_INPUT, username);
        sendKeys(PASSWORD_INPUT, password);
        clickElement(LOGIN_SUBMIT_BTN);
        return this;
    }

    public String getErrorMessage() {
        return getElementText(LOGIN_ERROR_MSG);
    }
}
