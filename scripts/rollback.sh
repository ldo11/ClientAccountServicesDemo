#!/usr/bin/env bash
# ==============================================================================
# Automated CI/CD Rollback Script
# Triggered immediately upon Smoke Test failure in test, intg, or uat
# ==============================================================================
set -e

ENV_TARGET="${1:-test}"
BACKUP_DIR="${2:-backups/${ENV_TARGET}}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "================================================================="
echo "[ROLLBACK INITIATED] Target Environment: [${ENV_TARGET}] at ${TIMESTAMP}"
echo "================================================================="

# 1. Terminate current failing runtime services
echo "[ROLLBACK - STEP 1] Stopping current active application services..."
if [ -f "backend.pid" ]; then
    KILL_PID=$(cat backend.pid)
    echo "Killing backend process (PID: ${KILL_PID})..."
    kill -9 "${KILL_PID}" 2>/dev/null || true
    rm -f backend.pid
fi

if [ -f "frontend.pid" ]; then
    KILL_PID=$(cat frontend.pid)
    echo "Killing frontend process (PID: ${KILL_PID})..."
    kill -9 "${KILL_PID}" 2>/dev/null || true
    rm -f frontend.pid
fi

# 2. Archive failure diagnostics & screenshots for incident post-mortem
echo "[ROLLBACK - STEP 2] Preserving failure reports & screenshots..."
mkdir -p "incident-reports/${ENV_TARGET}_${TIMESTAMP}"
if [ -d "qa-automation/target/reports" ]; then
    cp -r qa-automation/target/reports/* "incident-reports/${ENV_TARGET}_${TIMESTAMP}/" 2>/dev/null || true
fi
if [ -d "qa-automation/target/extent-reports" ]; then
    cp -r qa-automation/target/extent-reports/* "incident-reports/${ENV_TARGET}_${TIMESTAMP}/" 2>/dev/null || true
fi
if [ -f "backend.log" ]; then
    cp backend.log "incident-reports/${ENV_TARGET}_${TIMESTAMP}/backend_failure.log"
fi
if [ -f "frontend.log" ]; then
    cp frontend.log "incident-reports/${ENV_TARGET}_${TIMESTAMP}/frontend_failure.log"
fi

# 3. Restore last stable artifact backup if present
echo "[ROLLBACK - STEP 3] Restoring previous known-good deployment artifact..."
if [ -d "${BACKUP_DIR}/backend" ] && [ -d "${BACKUP_DIR}/frontend" ]; then
    echo "Restoring from ${BACKUP_DIR}..."
    rm -rf backend_failed frontend_failed
    mv backend backend_failed
    mv frontend frontend_failed
    cp -r "${BACKUP_DIR}/backend" backend
    cp -r "${BACKUP_DIR}/frontend" frontend
    echo "Rollback artifacts restored successfully."
else
    echo "No prior file backup bundle located at ${BACKUP_DIR}. Resetting working directory to last stable commit (HEAD)..."
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        git checkout -- .
    fi
fi

# 4. Restart stable baseline service
echo "[ROLLBACK - STEP 4] Restarting stable baseline service stack for ${ENV_TARGET}..."
cd backend
APP_ENV="${ENV_TARGET}" PORT=5000 nohup npm start > ../backend_rollback.log 2>&1 &
echo $! > ../backend.pid
cd ..

cd frontend
nohup npx vite --port 3000 --strictPort --host 0.0.0.0 > ../frontend_rollback.log 2>&1 &
echo $! > ../frontend.pid
cd ..

echo "================================================================="
echo "[ROLLBACK COMPLETED] Environment [${ENV_TARGET}] successfully restored to stable state."
echo "Diagnostics captured at: incident-reports/${ENV_TARGET}_${TIMESTAMP}"
echo "================================================================="
exit 0
