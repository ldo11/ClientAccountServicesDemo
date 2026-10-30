package com.fintech.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.List;

public class AccountDetailPage extends BasePage {
    private static final By DETAIL_ACCOUNT_TYPE = By.id("detail-account-type");
    private static final By DETAIL_ACCOUNT_NUMBER = By.id("detail-account-number");
    private static final By DETAIL_ACCOUNT_BALANCE = By.id("detail-account-balance");
    private static final By ACCOUNT_INTEREST_RATE = By.id("account-interest-rate");
    private static final By TRANSACTIONS_TABLE = By.id("transactions-table");
    private static final By TRANSACTION_ROWS = By.cssSelector("#transactions-table tbody tr");
    private static final By NAV_ACCOUNTS = By.id("nav-accounts");

    public AccountDetailPage(WebDriver driver) {
        super(driver);
    }

    public String getAccountType() {
        return getElementText(DETAIL_ACCOUNT_TYPE);
    }

    public String getAccountNumber() {
        return getElementText(DETAIL_ACCOUNT_NUMBER);
    }

    public String getAccountBalance() {
        return getElementText(DETAIL_ACCOUNT_BALANCE);
    }

    public String getAccountInterestRate() {
        return getElementText(ACCOUNT_INTEREST_RATE);
    }

    public boolean isTransactionsTableDisplayed() {
        return waitForVisibility(TRANSACTIONS_TABLE).isDisplayed();
    }

    public String getTransactionsTableText() {
        return getElementText(TRANSACTIONS_TABLE);
    }

    public List<WebElement> getTransactionRows() {
        waitForVisibility(TRANSACTIONS_TABLE);
        return driver.findElements(TRANSACTION_ROWS);
    }

    public AccountsListPage returnToAccounts() {
        clickElement(NAV_ACCOUNTS);
        return new AccountsListPage(driver);
    }
}
