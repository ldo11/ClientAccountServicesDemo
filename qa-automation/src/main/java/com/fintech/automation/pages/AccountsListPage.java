package com.fintech.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.List;

public class AccountsListPage extends BasePage {
    private static final By NAV_ACCOUNTS = By.id("nav-accounts");
    private static final By NAV_PROFILE = By.id("nav-profile");
    private static final By NAV_TRANSFER = By.id("nav-transfer");
    private static final By NAV_LOGOUT = By.id("nav-logout");

    private static final By CHECKING_CARD = By.cssSelector("[data-testid='account-card-CHECKING']");
    private static final By SAVINGS_CARD = By.cssSelector("[data-testid='account-card-SAVINGS']");
    private static final By BALANCE_CHECKING = By.id("balance-CHECKING");
    private static final By BALANCE_SAVINGS = By.id("balance-SAVINGS");
    private static final By VIEW_DETAILS_CHECKING = By.id("view-details-CHECKING");
    private static final By VIEW_DETAILS_SAVINGS = By.id("view-details-SAVINGS");

    // Applied interest rate locator
    private static final By ACCOUNT_INTEREST_RATE = By.id("account-interest-rate");

    // Account creation elements
    private static final By OPEN_CREATE_ACCOUNT_BTN = By.id("open-create-account-btn");
    private static final By CREATE_ACCOUNT_TYPE = By.id("create-account-type");
    private static final By SELECT_RATE_MARGIN = By.id("select-rate-margin");
    private static final By CREATE_INITIAL_BALANCE = By.id("create-initial-balance");
    private static final By SUBMIT_CREATE_ACCOUNT_BTN = By.id("submit-create-account-btn");
    private static final By ACCOUNTS_SUCCESS_MSG = By.id("accounts-success-msg");

    public AccountsListPage(WebDriver driver) {
        super(driver);
    }

    public boolean areAccountCardsDisplayed() {
        return waitForVisibility(CHECKING_CARD).isDisplayed()
                && waitForVisibility(SAVINGS_CARD).isDisplayed();
    }

    public String getCheckingBalance() {
        return getElementText(BALANCE_CHECKING);
    }

    public String getSavingsBalance() {
        return getElementText(BALANCE_SAVINGS);
    }

    public String getBalanceByType(String accountType) {
        if ("CHECKING".equalsIgnoreCase(accountType)) {
            return getCheckingBalance();
        }
        return getSavingsBalance();
    }

    public String getFirstDisplayedInterestRate() {
        return getElementText(ACCOUNT_INTEREST_RATE);
    }

    public List<WebElement> getAllInterestRateElements() {
        waitForVisibility(ACCOUNT_INTEREST_RATE);
        return driver.findElements(ACCOUNT_INTEREST_RATE);
    }

    public AccountsListPage createSavingsAccountWithMargin(String marginTier, String initialDeposit) {
        clickElement(OPEN_CREATE_ACCOUNT_BTN);
        selectDropdownByValue(CREATE_ACCOUNT_TYPE, "SAVINGS");
        selectDropdownByValue(SELECT_RATE_MARGIN, marginTier);
        sendKeys(CREATE_INITIAL_BALANCE, initialDeposit);
        clickElement(SUBMIT_CREATE_ACCOUNT_BTN);
        waitForVisibility(ACCOUNTS_SUCCESS_MSG);
        return this;
    }

    public AccountDetailPage viewCheckingDetails() {
        clickElement(VIEW_DETAILS_CHECKING);
        return new AccountDetailPage(driver);
    }

    public AccountDetailPage viewSavingsDetails() {
        clickElement(VIEW_DETAILS_SAVINGS);
        return new AccountDetailPage(driver);
    }

    public TransferFundsPage navigateToTransfer() {
        clickElement(NAV_TRANSFER);
        return new TransferFundsPage(driver);
    }

    public ClientProfilePage navigateToProfile() {
        clickElement(NAV_PROFILE);
        return new ClientProfilePage(driver);
    }

    public AccountsListPage navigateToAccounts() {
        clickElement(NAV_ACCOUNTS);
        return this;
    }

    public LoginPage logout() {
        clickElement(NAV_LOGOUT);
        return new LoginPage(driver);
    }
}
