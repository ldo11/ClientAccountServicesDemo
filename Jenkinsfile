pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['all', 'test', 'intg', 'uat'],
            description: 'Target Deployment Environment'
        )
        choice(
            name: 'BROWSER',
            choices: ['chrome', 'firefox', 'edge'],
            description: 'Browser for Selenium UI Tests'
        )
        booleanParam(
            name: 'HEADLESS',
            defaultValue: true,
            description: 'Run browsers in headless mode'
        )
    }

    tools {
        maven 'Maven-3.9'
        jdk 'JDK-17'
    }

    environment {
        API_BASE_URL = 'http://localhost:5000/api'
        UI_BASE_URL  = 'http://localhost:3000'
        DATABASE_URL = credentials('neon-postgres-db-url')
        JWT_SECRET   = 'charlotte_fintech_super_secret_key_2026'
    }

    stages {
        stage('Checkout & Create Pre-Deployment Backup') {
            steps {
                checkout scm
                sh '''
                    echo "[CI] Creating pre-deployment artifact backup for instant rollback..."
                    mkdir -p backups/test backups/intg backups/uat
                    cp -r backend backups/test/ 2>/dev/null || true
                    cp -r frontend backups/test/ 2>/dev/null || true
                    cp -r backend backups/intg/ 2>/dev/null || true
                    cp -r frontend backups/intg/ 2>/dev/null || true
                    cp -r backend backups/uat/ 2>/dev/null || true
                    cp -r frontend backups/uat/ 2>/dev/null || true
                '''
            }
        }

        // =====================================================================
        // ENVIRONMENT 1: TEST (Central Bank Mocked internally)
        // =====================================================================
        stage('Environment 1: Deploy & Test [test]') {
            when {
                expression { return params.DEPLOY_TARGET == 'all' || params.DEPLOY_TARGET == 'test' }
            }
            stages {
                stage('Deploy [test]') {
                    steps {
                        withEnv(['JENKINS_NODE_COOKIE=dontKillMe']) {
                            sh '''
                                set -e
                                echo "[CI-test] Deploying FinTech Stack with Central Bank Mock (APP_ENV=test)..."
                                cd backend
                                npm ci || npm install
                                APP_ENV=test PORT=5000 DATABASE_URL="${DATABASE_URL}" JWT_SECRET="${JWT_SECRET}" nohup npm start > ../backend.log 2>&1 &
                                echo $! > ../backend.pid
                                cd ..

                                cd frontend
                                npm ci || npm install
                                nohup npx vite --port 3000 --strictPort --host 0.0.0.0 > ../frontend.log 2>&1 &
                                echo $! > ../frontend.pid
                                cd ..

                                echo "[CI-test] Polling readiness..."
                                for i in $(seq 1 30); do
                                    if curl -sf "${API_BASE_URL}/health" | grep -q '"status":"UP"'; then
                                        echo "[CI-test] Backend is healthy in test mode."
                                        break
                                    fi
                                    sleep 2
                                done
                            '''
                        }
                    }
                }

                stage('Smoke Gate [test]') {
                    steps {
                        dir('qa-automation') {
                            sh """
                                mvn clean test \\
                                  -Denv=test \\
                                  -Dgroups=smoke \\
                                  -Dbrowser=${params.BROWSER} \\
                                  -Dheadless=${params.HEADLESS} \\
                                  -DsuiteXmlFile=src/test/resources/testsuites/smoke.xml \\
                                  -Dapi.base.url=${env.API_BASE_URL} \\
                                  -Dui.base.url=${env.UI_BASE_URL}
                            """
                        }
                    }
                    post {
                        failure {
                            echo "[CRITICAL] Smoke test gate failed in TEST environment! Triggering automated rollback..."
                            sh './scripts/rollback.sh test backups/test'
                            archiveArtifacts artifacts: 'incident-reports/**/*', allowEmptyArchive: true
                            error("Pipeline aborted: Automated rollback executed due to Smoke test failure in test.")
                        }
                    }
                }

                stage('Unit & Functional Verification [test]') {
                    steps {
                        sh '''
                            echo "[CI-test] Running Backend Unit Tests (Central Bank calculation logic)..."
                            cd backend
                            npm test
                            cd ..
                        '''
                        dir('qa-automation') {
                            sh """
                                echo "[CI-test] Running QA Functional Suite..."
                                mvn test \\
                                  -Denv=test \\
                                  -Dgroups=functional \\
                                  -Dbrowser=${params.BROWSER} \\
                                  -Dheadless=${params.HEADLESS} \\
                                  -DsuiteXmlFile=src/test/resources/testsuites/functional.xml \\
                                  -Dapi.base.url=${env.API_BASE_URL} \\
                                  -Dui.base.url=${env.UI_BASE_URL}
                            """
                        }
                    }
                }

                stage('Publish Report [test]') {
                    steps {
                        publishHTML(target: [
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'qa-automation/target/reports',
                            reportFiles: 'ExtentReport-test.html',
                            reportName: 'FinTech Extent Report (TEST)',
                            reportTitles: 'TEST Environment Automation Report'
                        ])
                        archiveArtifacts artifacts: 'qa-automation/target/reports/ExtentReport-test.html', allowEmptyArchive: true
                    }
                }
            }
            post {
                always {
                    sh '''
                        [ -f backend.pid ] && kill $(cat backend.pid) 2>/dev/null || true
                        [ -f frontend.pid ] && kill $(cat frontend.pid) 2>/dev/null || true
                        rm -f backend.pid frontend.pid
                    '''
                }
            }
        }

        // =====================================================================
        // ENVIRONMENT 2: INTG (Central Bank Sandbox Live)
        // =====================================================================
        stage('Environment 2: Deploy & Test [intg]') {
            when {
                expression { return params.DEPLOY_TARGET == 'all' || params.DEPLOY_TARGET == 'intg' }
            }
            stages {
                stage('Deploy [intg]') {
                    steps {
                        withEnv(['JENKINS_NODE_COOKIE=dontKillMe']) {
                            sh '''
                                set -e
                                echo "[CI-intg] Deploying FinTech Stack with Live Central Bank Sandbox (APP_ENV=intg)..."
                                cd backend
                                APP_ENV=intg PORT=5000 DATABASE_URL="${DATABASE_URL}" JWT_SECRET="${JWT_SECRET}" nohup npm start > ../backend.log 2>&1 &
                                echo $! > ../backend.pid
                                cd ..

                                cd frontend
                                nohup npx vite --port 3000 --strictPort --host 0.0.0.0 > ../frontend.log 2>&1 &
                                echo $! > ../frontend.pid
                                cd ..

                                sleep 5
                            '''
                        }
                    }
                }

                stage('Smoke Gate [intg]') {
                    steps {
                        dir('qa-automation') {
                            sh """
                                mvn test \\
                                  -Denv=intg \\
                                  -Dgroups=smoke \\
                                  -Dbrowser=${params.BROWSER} \\
                                  -Dheadless=${params.HEADLESS} \\
                                  -DsuiteXmlFile=src/test/resources/testsuites/smoke.xml \\
                                  -Dapi.base.url=${env.API_BASE_URL} \\
                                  -Dui.base.url=${env.UI_BASE_URL}
                            """
                        }
                    }
                    post {
                        failure {
                            echo "[CRITICAL] Smoke test gate failed in INTG environment! Triggering automated rollback..."
                            sh './scripts/rollback.sh intg backups/intg'
                            archiveArtifacts artifacts: 'incident-reports/**/*', allowEmptyArchive: true
                            error("Pipeline aborted: Automated rollback executed due to Smoke test failure in intg.")
                        }
                    }
                }

                stage('Integration Verification [intg]') {
                    steps {
                        dir('qa-automation') {
                            sh """
                                echo "[CI-intg] Running Central Bank Live Integration Suite..."
                                mvn test \\
                                  -Denv=intg \\
                                  -Dgroups=integration \\
                                  -Dbrowser=${params.BROWSER} \\
                                  -Dheadless=${params.HEADLESS} \\
                                  -DsuiteXmlFile=src/test/resources/testsuites/integration.xml \\
                                  -Dapi.base.url=${env.API_BASE_URL} \\
                                  -Dui.base.url=${env.UI_BASE_URL}
                            """
                        }
                    }
                }

                stage('Publish Report [intg]') {
                    steps {
                        publishHTML(target: [
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'qa-automation/target/reports',
                            reportFiles: 'ExtentReport-intg.html',
                            reportName: 'FinTech Extent Report (INTG)',
                            reportTitles: 'INTG Environment Automation Report'
                        ])
                        archiveArtifacts artifacts: 'qa-automation/target/reports/ExtentReport-intg.html', allowEmptyArchive: true
                    }
                }
            }
            post {
                always {
                    sh '''
                        [ -f backend.pid ] && kill $(cat backend.pid) 2>/dev/null || true
                        [ -f frontend.pid ] && kill $(cat frontend.pid) 2>/dev/null || true
                        rm -f backend.pid frontend.pid
                    '''
                }
            }
        }

        // =====================================================================
        // ENVIRONMENT 3: UAT (Pre-Production Acceptance)
        // =====================================================================
        stage('Environment 3: Deploy & Test [uat]') {
            when {
                expression { return params.DEPLOY_TARGET == 'all' || params.DEPLOY_TARGET == 'uat' }
            }
            stages {
                stage('Deploy [uat]') {
                    steps {
                        withEnv(['JENKINS_NODE_COOKIE=dontKillMe']) {
                            sh '''
                                set -e
                                echo "[CI-uat] Deploying FinTech Stack to UAT (APP_ENV=uat)..."
                                cd backend
                                APP_ENV=uat PORT=5000 DATABASE_URL="${DATABASE_URL}" JWT_SECRET="${JWT_SECRET}" nohup npm start > ../backend.log 2>&1 &
                                echo $! > ../backend.pid
                                cd ..

                                cd frontend
                                nohup npx vite --port 3000 --strictPort --host 0.0.0.0 > ../frontend.log 2>&1 &
                                echo $! > ../frontend.pid
                                cd ..

                                sleep 5
                            '''
                        }
                    }
                }

                stage('Smoke Gate ONLY [uat]') {
                    steps {
                        dir('qa-automation') {
                            sh """
                                mvn test \\
                                  -Denv=uat \\
                                  -Dgroups=smoke \\
                                  -Dbrowser=${params.BROWSER} \\
                                  -Dheadless=${params.HEADLESS} \\
                                  -DsuiteXmlFile=src/test/resources/testsuites/smoke.xml \\
                                  -Dapi.base.url=${env.API_BASE_URL} \\
                                  -Dui.base.url=${env.UI_BASE_URL}
                            """
                        }
                    }
                    post {
                        failure {
                            echo "[CRITICAL] Smoke test gate failed in UAT environment! Triggering automated rollback..."
                            sh './scripts/rollback.sh uat backups/uat'
                            archiveArtifacts artifacts: 'incident-reports/**/*', allowEmptyArchive: true
                            error("Pipeline aborted: Automated rollback executed due to Smoke test failure in uat.")
                        }
                    }
                }

                stage('Publish Report [uat]') {
                    steps {
                        publishHTML(target: [
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'qa-automation/target/reports',
                            reportFiles: 'ExtentReport-uat.html',
                            reportName: 'FinTech Extent Report (UAT)',
                            reportTitles: 'UAT Environment Automation Report'
                        ])
                        archiveArtifacts artifacts: 'qa-automation/target/reports/ExtentReport-uat.html', allowEmptyArchive: true
                    }
                }
            }
            post {
                always {
                    sh '''
                        [ -f backend.pid ] && kill $(cat backend.pid) 2>/dev/null || true
                        [ -f frontend.pid ] && kill $(cat frontend.pid) 2>/dev/null || true
                        rm -f backend.pid frontend.pid
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
