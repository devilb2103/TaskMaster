#!/bin/bash
DB_NAME="taskmaster-api" # The name of the database to back up (ensure this matches your MONGO_URI db name)
BACKUP_BASE_DIR="/var/backups/mongodb" # Base directory where backups will be stored (ensure this directory exists and has write permissions for the user running the script)

# --- Script Logic ---
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${DB_NAME}_${TIMESTAMP}" # Name of the specific backup directory within the base dir
FULL_BACKUP_PATH="${BACKUP_BASE_DIR}/${BACKUP_NAME}"

echo "------------------------------------"
echo "Starting MongoDB backup for database: ${DB_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo "Backup location: ${FULL_BACKUP_PATH}"
echo "------------------------------------"

mkdir -p "${BACKUP_BASE_DIR}"
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to create base backup directory: ${BACKUP_BASE_DIR}"
  echo "Please check permissions or create the directory manually."
  exit 1
fi

echo "Running mongodump..."
mongodump --db="${DB_NAME}" --out="${FULL_BACKUP_PATH}"

# Check the exit status of mongodump
DUMP_STATUS=$?

if [ ${DUMP_STATUS} -eq 0 ]; then
  echo "------------------------------------"
  echo "SUCCESS: MongoDB backup completed successfully!"
  echo "Backup saved to: ${FULL_BACKUP_PATH}"
  echo "------------------------------------"

  exit 0
else
  echo "------------------------------------"
  echo "ERROR: MongoDB backup FAILED!"
  echo "mongodump exited with status: ${DUMP_STATUS}"
  echo "Check mongodump output or logs for details."

  echo "------------------------------------"
  exit 1
fi