package com.fintech.automation.api;

public final class ApiEndpoints {
    public static final String HEALTH = "/health";
    public static final String SWAGGER_DOCS = "/api-docs/";
    public static final String SWAGGER_JSON = "/api-docs.json";
    public static final String CENTRAL_BANK_CEILING_RATE = "/central-bank/ceiling-rate";
    public static final String AUTH_REGISTER = "/auth/register";
    public static final String AUTH_LOGIN = "/auth/login";
    public static final String CLIENT_BY_ID = "/clients/{clientId}";
    public static final String ACCOUNTS = "/accounts";
    public static final String ACCOUNT_BY_ID = "/accounts/{accountId}";
    public static final String ACCOUNTS_TRANSFER = "/accounts/transfer";

    private ApiEndpoints() {
    }
}
