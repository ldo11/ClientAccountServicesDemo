package com.fintech.automation.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fintech.automation.config.ConfigReader;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ClientApiHelper {
    private static final Logger log = LogManager.getLogger(ClientApiHelper.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    public static class ProvisionedClient {
        private final String clientId;
        private final String username;
        private final String password;
        private final String mobile;
        private final String address;
        private final String token;
        private final Map<String, String> accountIds;
        private final Map<String, String> accountNumbers;
        private final Map<String, String> interestRates;

        public ProvisionedClient(
                String clientId,
                String username,
                String password,
                String mobile,
                String address,
                String token,
                Map<String, String> accountIds,
                Map<String, String> accountNumbers,
                Map<String, String> interestRates
        ) {
            this.clientId = clientId;
            this.username = username;
            this.password = password;
            this.mobile = mobile;
            this.address = address;
            this.token = token;
            this.accountIds = accountIds;
            this.accountNumbers = accountNumbers;
            this.interestRates = interestRates;
        }

        public String getClientId() {
            return clientId;
        }

        public String getUsername() {
            return username;
        }

        public String getPassword() {
            return password;
        }

        public String getMobile() {
            return mobile;
        }

        public String getAddress() {
            return address;
        }

        public String getToken() {
            return token;
        }

        public Map<String, String> getAccountIds() {
            return accountIds;
        }

        public String getAccountId(String accountType) {
            return accountIds.get(accountType);
        }

        public String getAccountNumber(String accountType) {
            return accountNumbers.get(accountType);
        }

        public String getInterestRate(String accountType) {
            return interestRates.get(accountType);
        }
    }

    public static ProvisionedClient registerClientViaApi(JsonNode clientPayload) {
        String baseUri = ConfigReader.getApiBaseUrl();
        String prefix = clientPayload.has("usernamePrefix")
                ? clientPayload.get("usernamePrefix").asText()
                : clientPayload.path("username").asText("qa_user");
        String uniqueSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String uniqueUsername = prefix + "_" + uniqueSuffix;

        String password = clientPayload.get("password").asText();
        String mobile = clientPayload.get("mobile").asText();
        String address = clientPayload.get("address").asText();
        double initialChecking = clientPayload.path("initialCheckingBalance").asDouble(1000.00);
        double initialSavings = clientPayload.path("initialSavingsBalance").asDouble(1000.00);
        int savingsMarginTier = clientPayload.path("savingsMarginTier").asInt(1);

        ObjectNode requestBody = mapper.createObjectNode();
        requestBody.put("username", uniqueUsername);
        requestBody.put("password", password);
        requestBody.put("mobile", mobile);
        requestBody.put("address", address);
        requestBody.put("initialCheckingBalance", initialChecking);
        requestBody.put("initialSavingsBalance", initialSavings);
        requestBody.put("savingsMarginTier", savingsMarginTier);

        log.info("API Pre-Condition: Registering fresh client '{}' via POST {}{}",
                uniqueUsername, baseUri, ApiEndpoints.AUTH_REGISTER);

        Response regResponse = RestAssured.given()
                .baseUri(baseUri)
                .contentType(ContentType.JSON)
                .body(requestBody.toString())
                .when()
                .post(ApiEndpoints.AUTH_REGISTER)
                .then()
                .statusCode(201)
                .extract()
                .response();

        String clientId = regResponse.jsonPath().getString("clientId");
        List<Map<String, Object>> accounts = regResponse.jsonPath().getList("accounts");

        Map<String, String> accountIds = new HashMap<>();
        Map<String, String> accountNumbers = new HashMap<>();
        Map<String, String> interestRates = new HashMap<>();
        for (Map<String, Object> acc : accounts) {
            String type = String.valueOf(acc.get("accountType"));
            accountIds.put(type, String.valueOf(acc.get("accountId")));
            accountNumbers.put(type, String.valueOf(acc.get("accountNumber")));
            interestRates.put(type, String.valueOf(acc.get("interestRate")));
        }

        String token = loginAndGetTokenViaApi(uniqueUsername, password);

        return new ProvisionedClient(
                clientId,
                uniqueUsername,
                password,
                mobile,
                address,
                token,
                accountIds,
                accountNumbers,
                interestRates
        );
    }

    public static String loginAndGetTokenViaApi(String username, String password) {
        ObjectNode loginBody = mapper.createObjectNode();
        loginBody.put("username", username);
        loginBody.put("password", password);

        Response loginResponse = RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl())
                .contentType(ContentType.JSON)
                .body(loginBody.toString())
                .when()
                .post(ApiEndpoints.AUTH_LOGIN)
                .then()
                .statusCode(200)
                .extract()
                .response();

        return loginResponse.jsonPath().getString("token");
    }

    public static Response getAccountsViaApi(String token) {
        return RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl())
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .when()
                .get(ApiEndpoints.ACCOUNTS)
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    public static String getAccountBalanceViaApi(String token, String accountType) {
        Response response = getAccountsViaApi(token);
        List<Map<String, Object>> accounts = response.jsonPath().getList("$");
        for (Map<String, Object> acc : accounts) {
            if (accountType.equalsIgnoreCase(String.valueOf(acc.get("accountType")))) {
                double val = Double.parseDouble(String.valueOf(acc.get("balance")));
                return String.format("%.2f", val);
            }
        }
        throw new IllegalStateException("Account type " + accountType + " not found in API response");
    }

    public static Response getCentralBankCeilingRate() {
        return RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl())
                .contentType(ContentType.JSON)
                .when()
                .get(ApiEndpoints.CENTRAL_BANK_CEILING_RATE)
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    public static Response getClientProfileViaApi(String token, String clientId) {
        return RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl())
                .header("Authorization", "Bearer " + token)
                .pathParam("clientId", clientId)
                .when()
                .get(ApiEndpoints.CLIENT_BY_ID)
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    public static void deleteClientViaApi(String token, String clientId) {
        if (token == null || clientId == null) {
            return;
        }
        log.info("API Teardown: Deleting test client '{}' via DELETE {}", clientId, ApiEndpoints.CLIENT_BY_ID);
        RestAssured.given()
                .baseUri(ConfigReader.getApiBaseUrl())
                .header("Authorization", "Bearer " + token)
                .pathParam("clientId", clientId)
                .when()
                .delete(ApiEndpoints.CLIENT_BY_ID)
                .then()
                .statusCode(200);
    }
}
