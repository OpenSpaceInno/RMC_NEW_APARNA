#!/usr/bin/env bash
# ==============================================================================
# Aparna RMC Gate-to-Exit Enterprise System - Production Automated Database Backup
# Target Database: rmc_gate_system (MySQL 8.0)
# Retention: Daily gzipped archives kept for 30 days
# Location: /opt/rmc-gate-system/deployment/backup-rmc-db.sh
# Cron: 0 2 * * * /opt/rmc-gate-system/deployment/backup-rmc-db.sh >> /var/log/rmc_backup.log 2>&1
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/backup/mysql/rmc_gate_system"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/rmc_gate_system_${TIMESTAMP}.sql.gz"
LOG_PREFIX="[RMC-DB-BACKUP $(date +"%Y-%m-%d %H:%M:%S")]"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-rmc_prod_svc}"
DB_PASS="${DB_PASSWORD:-SecureIndustrialPassword@2026}"
DB_NAME="${DB_NAME:-rmc_gate_system}"

echo "${LOG_PREFIX} Starting automated database backup for '${DB_NAME}'..."

# Ensure target directory exists
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# Execute mysqldump with single transaction consistency (No table lock disruption to live weighbridge)
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "${LOG_PREFIX} Successfully created compressed backup: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Prune archives older than 30 days
echo "${LOG_PREFIX} Pruning backup archives older than 30 days..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -type f -name "rmc_gate_system_*.sql.gz" -mtime +30 -print -delete | wc -l)
echo "${LOG_PREFIX} Pruned ${DELETED_COUNT} obsolete backup archive(s)."

echo "${LOG_PREFIX} Backup procedure completed successfully."

