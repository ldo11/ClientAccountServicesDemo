package com.fintech.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class TransferFundsPage extends BasePage {
    private static final By FROM_ACCOUNT_SELECT = By.id("transfer-from-account");
    private static final By TO_ACCOUNT_SELECT = By.id("transfer-to-account");
    private static final By AMOUNT_INPUT = By.id("transfer-amount");
    private static final By SUBMIT_BTN = By.id("transfer-submit-btn");
    private static final By SUCCESS_BANNER = By.id("transfer-success-msg");
    private static final By ERROR_BANNER = By.id("transfer-error-msg");
    private static final By NAV_ACCOUNTS = By.id("nav-accounts");

    public TransferFundsPage(WebDriver driver) {
        super(driver);
    }

    public TransferFundsPage executeTransfer(String fromAccountId, String toAccountId, String amount) {
        selectDropdownByValue(FROM_ACCOUNT_SELECT, fromAccountId);
        selectDropdownByValue(TO_ACCOUNT_SELECT, toAccountId);
        sendKeys(AMOUNT_INPUT, amount);
        clickElement(SUBMIT_BTN);
        return this;
    }

    public String getSuccessMessage() {
        return getElementText(SUCCESS_BANNER);
    }

    public String getErrorMessage() {
        return getElementText(ERROR_BANNER);
    }

    public AccountsListPage navigateToAccounts() {
        clickElement(NAV_ACCOUNTS);
        return new AccountsListPage(driver);
    }
}
