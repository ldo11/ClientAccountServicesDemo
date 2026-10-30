# Charlotte FinTech — Core Banking System & Enterprise Multi-Environment Test Automation

![Java 17](https://img.shields.io/badge/Java-17%20LTS-007396?logo=openjdk&logoColor=white)
![Selenium 4](https://img.shields.io/badge/Selenium-4.27-43B02A?logo=selenium&logoColor=white)
![REST Assured](https://img.shields.io/badge/REST%20Assured-5.5-009688)
![TestNG](https://img.shields.io/badge/TestNG-7.10-FF6C37)
![Swagger](https://img.shields.io/badge/OpenAPI-3.0%20%2F%20Swagger-85EA2D?logo=swagger&logoColor=black)
![ExtentReports](https://img.shields.io/badge/ExtentReports-5.1.1-1E293B)
![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless%20PostgreSQL-00E599?logo=postgresql&logoColor=black)

An enterprise-grade **End-to-End FinTech Banking System** and **Multi-Environment QA Test Automation Framework** featuring Central Bank regulatory ceiling rate compliance, interactive Swagger OpenAPI documentation, multi-tier TestNG execution (`smoke`, `functional`, `integration`), environment-isolated ExtentReports, and automated CI/CD rollback on smoke failure.

---

## 1. System Architecture & Central Bank Integration

```mermaid
flowchart TB
    subgraph Regulatory["Central Bank Regulatory Authority"]
        CB["Central Bank Sandbox API\nGET /api/central-bank/ceiling-rate\n(5.50% Ceiling Rate, USD)"]
    end

    subgraph CoreBackend["FinTech Core Backend API (Node.js/Express :5000)"]
        SWAG["Swagger / OpenAPI Docs\n/api-docs & /api-docs.json"]
        ADAPTER{"Central Bank Adapter\n(APP_ENV Controlled)"}
        MOCK["Internal Mock\n(5.00% Ceiling Rate)"]
        CALC["Interest Engine\nSavings: Ceiling - Margin (1% or 2%)\nChecking: 0.00%"]
        AUTH["JWT Auth & bcryptjs\n/api/auth/*"]
        TRANS["Atomic ACID Transfers\nBEGIN ... FOR UPDATE ... COMMIT"]
    end

    subgraph Database["Neon Serverless PostgreSQL"]
        PG[("clients (UUID)\naccounts (interest_rate)\ntransactions (Ledger)")]
    end

    subgraph FrontendPortal["FinTech Web Portal (React Vite :3000)"]
        UI_AUTH["Login & Registration"]
        UI_ACC["Account Overview & APY Display\nid='account-interest-rate'"]
        UI_CREATE["New Savings Account Creation\nid='select-rate-margin' (Tier 1 or 2)"]
        UI_TRANS["Instant Fund Transfers"]
    end

    subgraph QAFramework["Enterprise QA Framework (/qa-automation)"]
        SMOKE["Smoke Group\n(Health, Swagger, DB, Login)"]
        FUNC["Functional Group\n(Mocked Rate Verification, CRUD, Transfers)"]
        INTG["Integration Group\n(Live Sandbox -> Backend -> DB -> UI)"]
        EXTENT["Isolated ExtentReports\nExtentReport-test.html\nExtentReport-intg.html\nExtentReport-uat.html"]
    end

    ADAPTER -->|"APP_ENV=test"| MOCK
    ADAPTER -->|"APP_ENV=intg|uat"| CB
    MOCK --> CALC
    CB --> CALC
    CALC --> PG
    AUTH --> PG
    TRANS --> PG

    FrontendPortal -->|"Axios + Bearer JWT"| CoreBackend
    QAFramework -->|"REST Assured & Selenium"| CoreBackend
    QAFramework -->|"WebDriver Chrome/Firefox/Edge"| FrontendPortal
    QAFramework --> EXTENT
```

---

## 2. Central Bank Interest Rate Compliance & Calculation Rules

When creating accounts in the banking system, interest rates are calculated strictly based on regulatory rules:
- **Checking Accounts**: Standard transaction accounts always carry `0.00%` APY.
- **Savings Accounts**: Calculated dynamically by deducting the chosen margin tier from the regulatory ceiling rate:
  - **Tier 1 (Margin 1%)**: `ceilingRate - 1.00%`
  - **Tier 2 (Margin 2%)**: `ceilingRate - 2.00%`

### Environment-Aware Adapter Behavior:
| Environment (`APP_ENV`) | Central Bank Source | Ceiling Rate | Tier 1 Rate | Tier 2 Rate |
| :--- | :--- | :---: | :---: | :---: |
| **`test`** | Internal Mock (no network calls) | `5.00%` | **`4.00%`** | **`3.00%`** |
| **`intg`** | Live Central Bank Sandbox API | `5.50%` | **`4.50%`** | **`3.50%`** |
| **`uat`** | Live Central Bank Sandbox API | `5.50%` | **`4.50%`** | **`3.50%`** |

---

## 3. Interactive Swagger Documentation

Interactive OpenAPI 3.0 documentation is served directly from the Core Backend API:
- **Swagger UI Interactive Console**: `http://localhost:5000/api-docs`
- **OpenAPI JSON Specification**: `http://localhost:5000/api-docs.json`

---

## 4. Multi-Environment CI/CD & Automated Rollback Architecture

Both the **`Jenkinsfile`** and **`.github/workflows/test.yml`** orchestrate a 3-tier progressive delivery pipeline:

```mermaid
sequenceDiagram
    autonumber
    participant Pipeline as CI/CD Pipeline
    participant Backup as Backup Storage
    participant Env as Environment (test/intg/uat)
    participant QA as QA Test Runner
    participant Rollback as Rollback Engine (scripts/rollback.sh)

    Pipeline->>Backup: Create artifact backup before deployment
    Pipeline->>Env: Deploy & start services (APP_ENV)
    Pipeline->>QA: Run SMOKE Test Gate
    alt Smoke Tests PASS
        QA-->>Pipeline: Smoke Tests SUCCESS (HTTP 200, Swagger UP, Login OK)
        Pipeline->>QA: Run Functional / Integration Tests
        Pipeline->>Pipeline: Publish Environment ExtentReport
    else Smoke Tests FAIL
        QA-->>Pipeline: Smoke Tests FAILED
        Pipeline->>Rollback: Trigger automated rollback immediately
        Rollback->>Env: Kill failing services
        Rollback->>Backup: Restore previous known-good deployment artifact
        Rollback->>Env: Restart stable baseline stack
        Rollback->>Pipeline: Archive incident diagnostic logs & screenshots
        Pipeline-->>Pipeline: Abort deployment pipeline
    end
```

### Rollback Script Usage:
```bash
./scripts/rollback.sh <test|intg|uat> [backup_directory]
```
The automated script terminates failing processes, archives failure logs & screenshots to `incident-reports/`, restores the last stable build bundle from `backups/`, and restarts the baseline services.

---

## 5. Running the Application Locally

### Prerequisites
- Node.js 20+
- Java JDK 17 & Apache Maven 3.9+
- Google Chrome

### Step 1: Start Backend API (Port 5000)
```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL & JWT_SECRET if needed
npm install
APP_ENV=test npm start
```
Check health:
```bash
curl http://localhost:5000/api/health
# {"status":"UP","db":"CONNECTED","env":"test"}
```
View Swagger: `http://localhost:5000/api-docs`

### Step 2: Start Frontend Web Portal (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

---

## 6. QA Automation Execution Matrix

Navigate to `/qa-automation`:
```bash
cd qa-automation
```

### Run Smoke Tests (Quick Gate)
```bash
mvn clean test -Denv=test -Dgroups=smoke -DsuiteXmlFile=src/test/resources/testsuites/smoke.xml
```
*Generates: `target/reports/ExtentReport-test.html`*

### Run Functional Tests (Test Env — Mocked Central Bank)
```bash
mvn test -Denv=test -Dgroups=functional -DsuiteXmlFile=src/test/resources/testsuites/functional.xml
```
*Generates: `target/reports/ExtentReport-test.html`*

### Run Integration Tests (Intg Env — Live Central Bank Sandbox)
```bash
mvn test -Denv=intg -Dgroups=integration -DsuiteXmlFile=src/test/resources/testsuites/integration.xml
```
*Generates: `target/reports/ExtentReport-intg.html`*

### Run UAT Smoke Gate
```bash
mvn test -Denv=uat -Dgroups=smoke -DsuiteXmlFile=src/test/resources/testsuites/smoke.xml
```
*Generates: `target/reports/ExtentReport-uat.html`*

### Run Backend Unit Tests (Jest)
```bash
cd backend
npm test
```
*Covers interest rate calculation logic (`ceilingRate - 1%`, `ceilingRate - 2%`), JWT authentication, and API error guards.*
