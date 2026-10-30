package com.fintech.automation.tests;

import com.fintech.automation.api.ApiEndpoints;
import com.fintech.automation.api.ClientApiHelper;
import com.fintech.automation.api.ClientApiHelper.ProvisionedClient;
import com.fintech.automation.config.ConfigReader;
import com.fintech.automation.pages.AccountsListPage;
import com.fintech.automation.pages.LoginPage;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.Test;

public class SmokeTestSuite extends BaseTest {

    @Test(
            groups = {"smoke"},
            priority = 1,
            description = "Smoke: Core Backend API Health Check and Neon PostgreSQL DB connectivity"
    )
    public void testBackendHealthAndDatabaseConnection() {
        logStep("Executing Smoke Test: GET /api/health");
        Response response = RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl())
                .when()
                .get(ApiEndpoints.HEALTH)
                .then()
                .statusCode(200)
                .extract()
                .response();

        String status = response.jsonPath().getString("status");
        String db = response.jsonPath().getString("db");
        logStep("Response: status=" + status + ", db=" + db);

        Assert.assertEquals(status, "UP", "Core Backend API must report status UP");
        Assert.assertEquals(db, "CONNECTED", "Neon PostgreSQL must be CONNECTED");
    }

    @Test(
            groups = {"smoke"},
            priority = 2,
            description = "Smoke: Verify Swagger UI & OpenAPI Specification availability (/api-docs)"
    )
    public void testSwaggerDocumentationEndpoint() {
        logStep("Executing Smoke Test: GET /api-docs/ and /api-docs.json");
        Response docsUiResponse = RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl().replace("/api", ""))
                .when()
                .get(ApiEndpoints.SWAGGER_DOCS)
                .then()
                .extract()
                .response();

        Assert.assertTrue(
                docsUiResponse.statusCode() == 200 || docsUiResponse.statusCode() == 301 || docsUiResponse.statusCode() == 302,
                "Swagger UI endpoint must return HTTP 200 or redirect (got " + docsUiResponse.statusCode() + ")"
        );

        Response docsJsonResponse = RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl().replace("/api", ""))
                .when()
                .get(ApiEndpoints.SWAGGER_JSON)
                .then()
                .statusCode(200)
                .extract()
                .response();

        Assert.assertEquals(docsJsonResponse.jsonPath().getString("openapi"), "3.0.3");
        Assert.assertTrue(docsJsonResponse.jsonPath().getString("info.title").contains("Charlotte FinTech"));
    }

    @Test(
            groups = {"smoke"},
            priority = 3,
            description = "Smoke: Central Bank Sandbox Endpoint Availability"
    )
    public void testCentralBankSandboxAvailability() {
        logStep("Executing Smoke Test: GET /api/central-bank/ceiling-rate");
        Response response = ClientApiHelper.getCentralBankCeilingRate();
        Assert.assertEquals(response.statusCode(), 200);
        Assert.assertEquals(response.jsonPath().getString("currency"), "USD");
        Assert.assertNotNull(response.jsonPath().get("ceilingRate"));
    }

    @Test(
            groups = {"smoke"},
            priority = 4,
            description = "Smoke: Browser UI Startup & Basic Authentication Flow"
    )
    public void testBasicUiLoginSmoke() {
        logStep("Executing Smoke Test: Provisioning user via API and executing UI Login");
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode payload = mapper.createObjectNode();
        payload.put("usernamePrefix", "smoke_user");
        payload.put("password", "FinTech@Smoke2026!");
        payload.put("mobile", "704-555-0001");
        payload.put("address", "100 South Tryon St, Charlotte, NC");

        ProvisionedClient client = ClientApiHelper.registerClientViaApi(payload);
        registerClientForTeardown(client);

        LoginPage loginPage = new LoginPage(getDriver()).open();
        AccountsListPage accountsListPage = loginPage.loginAs(client.getUsername(), client.getPassword());
        Assert.assertTrue(accountsListPage.areAccountCardsDisplayed(), "Account overview cards must render upon successful login");
    }
}
