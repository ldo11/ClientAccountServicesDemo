package com.fintech.automation.tests;

import com.fasterxml.jackson.databind.JsonNode;
import com.fintech.automation.api.ClientApiHelper;
import com.fintech.automation.api.ClientApiHelper.ProvisionedClient;
import com.fintech.automation.pages.AccountsListPage;
import com.fintech.automation.pages.ClientProfilePage;
import com.fintech.automation.pages.LoginPage;
import com.fintech.automation.utils.JsonDataReader;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;

public class ClientProfileTest extends BaseTest {

    @Test(
            groups = {"functional"},
            description = "Hybrid E2E: Seed client via API, update mobile & address via UI, and verify persistence via API"
    )
    public void testUpdateClientProfileHybridFlow() {
        JsonNode rootData = JsonDataReader.readJsonResource("testdata/transfer_testdata.json");
        JsonNode profileScenario = rootData.get("profileUpdateScenario");
        JsonNode clientPayload = profileScenario.get("client");

        String updatedMobile = profileScenario.get("updatedMobile").asText();
        String updatedAddress = profileScenario.get("updatedAddress").asText();

        logStep("Pre-Condition (API): Provisioning fresh banking client via REST Assured");
        ProvisionedClient client = ClientApiHelper.registerClientViaApi(clientPayload);
        registerClientForTeardown(client);

        logStep("Step 1 (UI): Logging into Banking Portal as '" + client.getUsername() + "'");
        LoginPage loginPage = new LoginPage(getDriver()).open();
        AccountsListPage accountsPage = loginPage.loginAs(client.getUsername(), client.getPassword());
        Assert.assertTrue(accountsPage.areAccountCardsDisplayed(), "Account cards should be visible after login");

        logStep("Step 2 (UI): Navigating to Client Profile page and validating seeded readonly attributes");
        ClientProfilePage profilePage = accountsPage.navigateToProfile();
        Assert.assertEquals(profilePage.getClientIdText(), client.getClientId(), "Displayed Client ID mismatch");
        Assert.assertEquals(profilePage.getUsernameText(), client.getUsername(), "Displayed Username mismatch");
        Assert.assertEquals(profilePage.getMobileInputValue(), client.getMobile(), "Initial mobile mismatch");
        Assert.assertEquals(profilePage.getAddressInputValue(), client.getAddress(), "Initial address mismatch");

        logStep("Step 3 (UI): Updating mobile and residential address and asserting confirmation banner");
        profilePage.updateProfile(updatedMobile, updatedAddress);
        Assert.assertEquals(
                profilePage.getSuccessBannerText(),
                "Profile updated successfully",
                "Profile update confirmation banner text mismatch"
        );

        logStep("Step 4 (API Verification): Querying GET /api/clients/{clientId} via REST Assured to assert DB persistence");
        Response apiProfileRes = ClientApiHelper.getClientProfileViaApi(client.getToken(), client.getClientId());
        Assert.assertEquals(apiProfileRes.jsonPath().getString("mobile"), updatedMobile,
                "Neon PostgreSQL mobile field did not persist updated value");
        Assert.assertEquals(apiProfileRes.jsonPath().getString("address"), updatedAddress,
                "Neon PostgreSQL address field did not persist updated value");
    }
}
