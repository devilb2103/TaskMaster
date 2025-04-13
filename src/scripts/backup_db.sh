#!/bin/bash

# Basic MongoDB Backup Script for TaskMaster API

# --- Configuration ---
# Consider moving these to environment variables (.env) or script arguments for flexibility
DB_NAME="taskmaster-api" # The name of the database to back up (ensure this matches your MONGO_URI db name)
BACKUP_BASE_DIR="/var/backups/mongodb" # Base directory where backups will be stored (ensure this directory exists and has write permissions for the user running the script)
# Example using environment variables (if you set them up)
# DB_NAME="${MONGO_DB_NAME:-taskmaster-api}" # Use env var or default
# BACKUP_BASE_DIR="${MONGO_BACKUP_DIR:-/var/backups/mongodb}"

# Authentication (Uncomment and configure if your MongoDB requires auth)
# MONGO_USER="${MONGO_USER}"
# MONGO_PASS="${MONGO_PASS}"
# MONGO_HOST="${MONGO_HOST:-127.0.0.1}" # Default to localhost if not set
# AUTH_OPTS="--username=${MONGO_USER} --password=${MONGO_PASS} --authenticationDatabase=admin --host=${MONGO_HOST}"
# URI_OPT="--uri=\"mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}/${DB_NAME}?authSource=admin\"" # Alternative: Use URI

# --- Script Logic ---
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${DB_NAME}_${TIMESTAMP}" # Name of the specific backup directory within the base dir
FULL_BACKUP_PATH="${BACKUP_BASE_DIR}/${BACKUP_NAME}"

echo "------------------------------------"
echo "Starting MongoDB backup for database: ${DB_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo "Backup location: ${FULL_BACKUP_PATH}"
echo "------------------------------------"

# Create the base backup directory if it doesn't exist
# Use -p to create parent directories as needed and prevent errors if it already exists
mkdir -p "${BACKUP_BASE_DIR}"
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to create base backup directory: ${BACKUP_BASE_DIR}"
  echo "Please check permissions or create the directory manually."
  exit 1
fi

# Execute mongodump
# Add $AUTH_OPTS or $URI_OPT here if using authentication
echo "Running mongodump..."
mongodump --db="${DB_NAME}" --out="${FULL_BACKUP_PATH}"
# Example with basic auth opts:
# mongodump ${AUTH_OPTS} --db="${DB_NAME}" --out="${FULL_BACKUP_PATH}"
# Example with URI:
# mongodump ${URI_OPT} --out="${FULL_BACKUP_PATH}"


# Check the exit status of mongodump
DUMP_STATUS=$?

if [ ${DUMP_STATUS} -eq 0 ]; then
  echo "------------------------------------"
  echo "SUCCESS: MongoDB backup completed successfully!"
  echo "Backup saved to: ${FULL_BACKUP_PATH}"
  echo "------------------------------------"

  # Optional: Add cleanup for old backups (e.g., remove backups older than 7 days)
  # echo "Cleaning up old backups..."
  # find "${BACKUP_BASE_DIR}" -maxdepth 1 -type d -name "${DB_NAME}_*" -mtime +7 -exec echo "Removing old backup: {}" \; -exec rm -rf {} \;

  exit 0
else
  echo "------------------------------------"
  echo "ERROR: MongoDB backup FAILED!"
  echo "mongodump exited with status: ${DUMP_STATUS}"
  echo "Check mongodump output or logs for details."
  # Optional: Remove the potentially incomplete backup directory
  # rm -rf "${FULL_BACKUP_PATH}"
  echo "------------------------------------"
  exit 1
fi