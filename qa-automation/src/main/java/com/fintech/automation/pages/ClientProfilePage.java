package com.fintech.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class ClientProfilePage extends BasePage {
    private static final By CLIENT_ID_VAL = By.id("client-id-val");
    private static final By CLIENT_USERNAME_VAL = By.id("client-username-val");
    private static final By CLIENT_MOBILE_INPUT = By.id("client-mobile-input");
    private static final By CLIENT_ADDRESS_INPUT = By.id("client-address-input");
    private static final By UPDATE_PROFILE_BTN = By.id("update-profile-btn");
    private static final By PROFILE_UPDATE_SUCCESS = By.id("profile-update-success");

    public ClientProfilePage(WebDriver driver) {
        super(driver);
    }

    public String getClientIdText() {
        return getElementText(CLIENT_ID_VAL);
    }

    public String getUsernameText() {
        return getElementText(CLIENT_USERNAME_VAL);
    }

    public String getMobileInputValue() {
        return waitForVisibility(CLIENT_MOBILE_INPUT).getAttribute("value");
    }

    public String getAddressInputValue() {
        return waitForVisibility(CLIENT_ADDRESS_INPUT).getAttribute("value");
    }

    public ClientProfilePage updateProfile(String newMobile, String newAddress) {
        sendKeys(CLIENT_MOBILE_INPUT, newMobile);
        sendKeys(CLIENT_ADDRESS_INPUT, newAddress);
        clickElement(UPDATE_PROFILE_BTN);
        return this;
    }

    public String getSuccessBannerText() {
        return getElementText(PROFILE_UPDATE_SUCCESS);
    }
}
