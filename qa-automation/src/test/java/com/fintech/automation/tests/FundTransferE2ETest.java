package com.fintech.automation.tests;

import com.fasterxml.jackson.databind.JsonNode;
import com.fintech.automation.api.ClientApiHelper;
import com.fintech.automation.api.ClientApiHelper.ProvisionedClient;
import com.fintech.automation.pages.AccountDetailPage;
import com.fintech.automation.pages.AccountsListPage;
import com.fintech.automation.pages.LoginPage;
import com.fintech.automation.pages.TransferFundsPage;
import com.fintech.automation.utils.JsonDataReader;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class FundTransferE2ETest extends BaseTest {

    @DataProvider(name = "transferData")
    public Object[][] getTransferTestData() {
        return JsonDataReader.getArrayAsDataProvider("testdata/transfer_testdata.json", "dataDrivenTransfers");
    }

    @Test(
            groups = {"functional"},
            priority = 1,
            description = "Hybrid E2E: API Client Setup ($1500/$500) -> UI Transfer ($300) -> UI + Statement + API Balance Verification"
    )
    public void testAtomicFundTransferCheckingToSavingsE2E() {
        JsonNode root = JsonDataReader.readJsonResource("testdata/transfer_testdata.json");
        JsonNode scenario = root.get("e2eTransferScenario");
        JsonNode clientNode = scenario.get("client");
        JsonNode transferNode = scenario.get("transfer");

        logStep("Pre-Condition (API): Seeding client with $1500.00 CHECKING and $500.00 SAVINGS via REST Assured");
        ProvisionedClient client = ClientApiHelper.registerClientViaApi(clientNode);
        registerClientForTeardown(client);

        logStep("Step 1 (UI): Authenticating via LoginPage with provisioned client credentials");
        LoginPage loginPage = new LoginPage(getDriver()).open();
        AccountsListPage accountsListPage = loginPage.loginAs(client.getUsername(), client.getPassword());

        logStep("Step 2 (UI): Verifying initial account balances on AccountsListPage ($1500.00 and $500.00)");
        Assert.assertTrue(accountsListPage.areAccountCardsDisplayed(), "Both CHECKING and SAVINGS cards must render");
        Assert.assertEquals(accountsListPage.getCheckingBalance(), "1500.00", "Initial CHECKING balance mismatch");
        Assert.assertEquals(accountsListPage.getSavingsBalance(), "500.00", "Initial SAVINGS balance mismatch");

        // Verify applied interest rate element is present
        Assert.assertNotNull(accountsListPage.getFirstDisplayedInterestRate(), "Interest rate must be displayed");

        logStep("Step 3 (UI): Navigating to TransferFundsPage and transferring $300.00 from CHECKING to SAVINGS");
        TransferFundsPage transferPage = accountsListPage.navigateToTransfer();
        String fromAccountId = client.getAccountId(transferNode.get("fromAccountType").asText());
        String toAccountId = client.getAccountId(transferNode.get("toAccountType").asText());
        String amount = transferNode.get("amount").asText();

        transferPage.executeTransfer(fromAccountId, toAccountId, amount);
        Assert.assertEquals(
                transferPage.getSuccessMessage(),
                "Transfer completed successfully",
                "Transfer success banner mismatch"
        );

        logStep("Step 4a (UI): Returning to AccountsListPage and verifying updated balances ($1200.00 and $800.00)");
        accountsListPage = transferPage.navigateToAccounts();
        Assert.assertEquals(
                accountsListPage.getCheckingBalance(),
                transferNode.get("expectedSourceBalance").asText(),
                "Updated UI CHECKING balance mismatch"
        );
        Assert.assertEquals(
                accountsListPage.getSavingsBalance(),
                transferNode.get("expectedDestinationBalance").asText(),
                "Updated UI SAVINGS balance mismatch"
        );

        logStep("Step 4b (UI): Inspecting Checking Account Detail page and Transaction Ledger");
        AccountDetailPage detailPage = accountsListPage.viewCheckingDetails();
        Assert.assertEquals(detailPage.getAccountType(), "CHECKING", "Account detail header mismatch");
        Assert.assertEquals(detailPage.getAccountNumber(), client.getAccountNumber("CHECKING"), "Account number mismatch");
        Assert.assertEquals(detailPage.getAccountBalance(), "1200.00", "Detail page balance mismatch");
        Assert.assertEquals(detailPage.getAccountInterestRate(), "0.00%", "Checking account APY must be 0.00%");
        Assert.assertTrue(detailPage.isTransactionsTableDisplayed(), "Transactions table must be visible");
        Assert.assertTrue(detailPage.getTransactionsTableText().contains("300.00"),
                "Transactions table should contain the $300.00 transfer record");

        logStep("Step 4c (API Verification): Asserting Neon PostgreSQL balances via GET /api/accounts");
        Assert.assertEquals(
                ClientApiHelper.getAccountBalanceViaApi(client.getToken(), "CHECKING"),
                "1200.00",
                "Backend CHECKING balance mismatch"
        );
        Assert.assertEquals(
                ClientApiHelper.getAccountBalanceViaApi(client.getToken(), "SAVINGS"),
                "800.00",
                "Backend SAVINGS balance mismatch"
        );
    }

    @Test(
            groups = {"functional"},
            priority = 2,
            dataProvider = "transferData",
            description = "Data-Driven Hybrid Scenarios (Valid Transfer & Insufficient Funds ACID Rollback)"
    )
    public void testDataDrivenFundTransferScenarios(JsonNode scenario) {
        String scenarioName = scenario.get("scenarioName").asText();
        logStep("Executing Data-Driven Scenario: " + scenarioName);

        ProvisionedClient client = ClientApiHelper.registerClientViaApi(scenario.get("client"));
        registerClientForTeardown(client);

        AccountsListPage accountsListPage = new LoginPage(getDriver())
                .open()
                .loginAs(client.getUsername(), client.getPassword());
        Assert.assertTrue(accountsListPage.areAccountCardsDisplayed(), "Account cards must be displayed");

        TransferFundsPage transferPage = accountsListPage.navigateToTransfer();
        String fromId = client.getAccountId(scenario.get("fromAccountType").asText());
        String toId = client.getAccountId(scenario.get("toAccountType").asText());
        String amount = scenario.get("amount").asText();
        boolean expectSuccess = scenario.get("expectSuccess").asBoolean();
        String expectedMsg = scenario.get("expectedMessage").asText();

        transferPage.executeTransfer(fromId, toId, amount);

        if (expectSuccess) {
            Assert.assertEquals(transferPage.getSuccessMessage(), expectedMsg, "Expected transfer success banner");
        } else {
            Assert.assertTrue(
                    transferPage.getErrorMessage().toLowerCase().contains(expectedMsg.toLowerCase()),
                    "Expected error banner containing '" + expectedMsg + "' but got: " + transferPage.getErrorMessage()
            );
        }

        // Verify UI and Backend balances remain consistent (ACID commit or rollback)
        String expectedChecking = scenario.get("expectedCheckingBalance").asText();
        String expectedSavings = scenario.get("expectedSavingsBalance").asText();

        accountsListPage = transferPage.navigateToAccounts();
        Assert.assertEquals(accountsListPage.getCheckingBalance(), expectedChecking, "UI CHECKING balance mismatch");
        Assert.assertEquals(accountsListPage.getSavingsBalance(), expectedSavings, "UI SAVINGS balance mismatch");

        Assert.assertEquals(
                ClientApiHelper.getAccountBalanceViaApi(client.getToken(), "CHECKING"),
                expectedChecking,
                "API CHECKING balance mismatch"
        );
        Assert.assertEquals(
                ClientApiHelper.getAccountBalanceViaApi(client.getToken(), "SAVINGS"),
                expectedSavings,
                "API SAVINGS balance mismatch"
        );
    }

    @Test(
            groups = {"functional"},
            priority = 3,
            description = "Negative UI Check & Toggleable Failure Screenshot Capture Demo (-Ddemo.failure=true)"
    )
    public void verifyFailureScreenshotCapture() {
        boolean triggerDemoFailure = Boolean.parseBoolean(System.getProperty("demo.failure", "false"));

        LoginPage loginPage = new LoginPage(getDriver()).open();
        loginPage.submitInvalidCredentials("non_existent_user_999", "WrongPass!2026");

        String errorBanner = loginPage.getErrorMessage();
        logStep("Verified invalid login displays error alert: " + errorBanner);
        Assert.assertTrue(
                errorBanner.toLowerCase().contains("invalid"),
                "Login error message should indicate invalid credentials"
        );

        if (triggerDemoFailure) {
            logStep("Demo failure mode enabled (-Ddemo.failure=true): triggering intentional failure for ExtentReport screenshot demo");
            Assert.fail("Intentional interview demo failure to showcase automatic Base64 screenshot attachment in ExtentReport.html");
        }
    }
}
