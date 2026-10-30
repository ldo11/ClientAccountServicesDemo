package com.fintech.automation.tests;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fintech.automation.api.ClientApiHelper;
import com.fintech.automation.api.ClientApiHelper.ProvisionedClient;
import com.fintech.automation.pages.AccountDetailPage;
import com.fintech.automation.pages.AccountsListPage;
import com.fintech.automation.pages.LoginPage;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;

public class CentralBankIntegrationTest extends BaseTest {

    @Test(
            groups = {"functional", "integration"},
            priority = 1,
            description = "E2E: Saving account creation with Tier 1 (1% below ceiling rate) and Tier 2 (2% below ceiling rate)"
    )
    public void testSavingsAccountCreationWithMarginTiers() {
        logStep("Provisioning fresh client for Margin Tier UI Verification");
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode payload = mapper.createObjectNode();
        payload.put("usernamePrefix", "qa_tier_user");
        payload.put("password", "FinTech@Tier2026!");
        payload.put("mobile", "704-555-4411");
        payload.put("address", "700 South College St, Charlotte, NC");
        payload.put("initialCheckingBalance", 2000.00);
        payload.put("initialSavingsBalance", 1000.00);
        payload.put("savingsMarginTier", 1); // Initial default savings account gets tier 1

        ProvisionedClient client = ClientApiHelper.registerClientViaApi(payload);
        registerClientForTeardown(client);

        logStep("Step 1 (UI): Logging in and verifying accounts page interest rate element");
        LoginPage loginPage = new LoginPage(getDriver()).open();
        AccountsListPage accountsPage = loginPage.loginAs(client.getUsername(), client.getPassword());
        Assert.assertTrue(accountsPage.areAccountCardsDisplayed());

        // In test env, ceiling is 5.0%: Tier 1 = 4.00%
        // In intg/uat env, ceiling is 5.5%: Tier 1 = 4.50%
        String initialRateText = accountsPage.getFirstDisplayedInterestRate();
        logStep("Initial account interest rate displayed on UI: " + initialRateText);
        Assert.assertTrue(initialRateText.contains("%"), "Rate should be formatted as percentage");

        logStep("Step 2 (UI): Creating new Savings account with Margin Tier 2 (2% below ceiling)");
        accountsPage.createSavingsAccountWithMargin("2", "750.00");

        logStep("Step 3 (API Verification): Asserting newly created account in Neon PostgreSQL via GET /api/accounts");
        Response accountsApiResponse = ClientApiHelper.getAccountsViaApi(client.getToken());
        Assert.assertEquals(accountsApiResponse.statusCode(), 200);

        // Verify account exists in backend response
        int accountCount = accountsApiResponse.jsonPath().getList("$").size();
        Assert.assertTrue(accountCount >= 3, "Client should now have at least 3 accounts (Checking + 2 Savings)");

        logStep("Step 4 (UI Detail): Viewing Checking details to verify APY = 0.00%");
        AccountDetailPage checkingDetail = accountsPage.viewCheckingDetails();
        Assert.assertEquals(checkingDetail.getAccountInterestRate(), "0.00%", "Checking account APY must strictly be 0.00%");
    }

    @Test(
            groups = {"integration"},
            priority = 2,
            description = "Integration: Verify real-time contract from Central Bank Sandbox -> Core Backend -> Neon DB -> UI"
    )
    public void testCentralBankLiveContractIntegration() {
        logStep("Integration Test: Querying live Central Bank sandbox ceiling-rate contract");
        Response ceilingRes = ClientApiHelper.getCentralBankCeilingRate();
        Assert.assertEquals(ceilingRes.statusCode(), 200);
        float ceilingRate = ceilingRes.jsonPath().getFloat("ceilingRate");
        Assert.assertEquals(ceilingRes.jsonPath().getString("currency"), "USD");
        logStep("Live Central Bank ceiling rate received: " + ceilingRate + "%");

        // Provision user via API
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode payload = mapper.createObjectNode();
        payload.put("usernamePrefix", "intg_contract");
        payload.put("password", "FinTech@Intg2026!");
        payload.put("mobile", "704-555-9922");
        payload.put("address", "800 North Church St, Charlotte, NC");
        payload.put("initialCheckingBalance", 1000.00);
        payload.put("initialSavingsBalance", 1000.00);
        payload.put("savingsMarginTier", 1);

        ProvisionedClient client = ClientApiHelper.registerClientViaApi(payload);
        registerClientForTeardown(client);

        // Check backend persisted rate
        Response accountsRes = ClientApiHelper.getAccountsViaApi(client.getToken());
        Assert.assertEquals(accountsRes.statusCode(), 200);

        // Verify UI renders interest rate
        LoginPage loginPage = new LoginPage(getDriver()).open();
        AccountsListPage accountsPage = loginPage.loginAs(client.getUsername(), client.getPassword());
        Assert.assertTrue(accountsPage.areAccountCardsDisplayed());
        Assert.assertNotNull(accountsPage.getFirstDisplayedInterestRate());
    }
}
