package com.fintech.automation.pages;

import com.fintech.automation.config.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public abstract class BasePage {
    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(ConfigReader.getExplicitWaitSeconds()));
    }

    protected WebElement waitForVisibility(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void clickElement(By locator) {
        waitForClickable(locator).click();
    }

    protected void sendKeys(By locator, String value) {
        WebElement element = waitForVisibility(locator);
        element.clear();
        String existingVal = element.getAttribute("value");
        if (existingVal != null && !existingVal.isEmpty()) {
            boolean isMac = System.getProperty("os.name", "").toLowerCase().contains("mac");
            Keys modifier = isMac ? Keys.COMMAND : Keys.CONTROL;
            element.sendKeys(Keys.chord(modifier, "a"), Keys.BACK_SPACE);
        }
        element.sendKeys(value);
    }

    protected String getElementText(By locator) {
        return waitForVisibility(locator).getText().trim();
    }

    protected void selectDropdownByValue(By locator, String value) {
        WebElement selectElem = waitForVisibility(locator);
        Select select = new Select(selectElem);
        select.selectByValue(value);
    }
}
