const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Charlotte FinTech Core Banking API",
    version: "2.0.0",
    description: "Enterprise REST API for Client Management, Accounts, Atomic Money Transfers, and Central Bank Interest Rate Compliance."
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local / Development Server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "Service Health Check",
        responses: {
          "200": {
            description: "Service is operational and database connected",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "UP" },
                    db: { type: "string", example: "CONNECTED" },
                    env: { type: "string", example: "test" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/central-bank/ceiling-rate": {
      get: {
        summary: "Central Bank Sandbox Regulatory Ceiling Rate",
        responses: {
          "200": {
            description: "Current regulatory interest rate ceiling",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ceilingRate: { type: "number", example: 5.5 },
                    currency: { type: "string", example: "USD" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/register": {
      post: {
        summary: "Register a new client with default checking and savings accounts",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password", "mobile", "address"],
                properties: {
                  username: { type: "string", example: "john_doe" },
                  password: { type: "string", example: "SecurePass123!" },
                  mobile: { type: "string", example: "704-555-0100" },
                  address: { type: "string", example: "100 S Tryon St, Charlotte, NC" },
                  initialCheckingBalance: { type: "number", example: 1000 },
                  initialSavingsBalance: { type: "number", example: 1000 },
                  savingsMarginTier: { type: "integer", enum: [1, 2], example: 1 }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Client created successfully" },
          "400": { description: "Validation error" },
          "409": { description: "Username already exists" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Authenticate client and issue JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "john_doe" },
                  password: { type: "string", example: "SecurePass123!" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Authentication successful, returns JWT token" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/clients/{clientId}": {
      get: {
        summary: "Get client profile",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "clientId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Client profile found" },
          "401": { description: "Unauthorized" },
          "404": { description: "Client not found" }
        }
      },
      put: {
        summary: "Update client profile contact details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "clientId", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  mobile: { type: "string", example: "704-555-0199" },
                  address: { type: "string", example: "200 South Blvd, Charlotte, NC" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Profile updated" },
          "401": { description: "Unauthorized" }
        }
      },
      delete: {
        summary: "Delete client and cascade remove associated accounts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "clientId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Client deleted" },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/accounts": {
      get: {
        summary: "List all accounts for authenticated client",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of user accounts" },
          "401": { description: "Unauthorized" }
        }
      },
      post: {
        summary: "Create a new account (SAVINGS with Central Bank margin tier or CHECKING)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["accountType"],
                properties: {
                  accountType: { type: "string", enum: ["SAVINGS", "CHECKING"], example: "SAVINGS" },
                  initialBalance: { type: "number", example: 500 },
                  marginTier: { type: "integer", enum: [1, 2], example: 1, description: "1 = 1% below ceiling, 2 = 2% below ceiling" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Account created with calculated interest rate" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/accounts/{accountId}": {
      get: {
        summary: "Get account details and recent transactions",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "accountId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Account details returned" },
          "401": { description: "Unauthorized" },
          "404": { description: "Account not found" }
        }
      }
    },
    "/accounts/transfer": {
      post: {
        summary: "Perform atomic fund transfer between accounts",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fromAccountId", "toAccountId", "amount"],
                properties: {
                  fromAccountId: { type: "string" },
                  toAccountId: { type: "string" },
                  amount: { type: "number", example: 150.00 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Transfer completed successfully" },
          "400": { description: "Insufficient funds or bad request" },
          "401": { description: "Unauthorized" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
