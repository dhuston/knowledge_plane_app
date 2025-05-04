#!/bin/bash

# This script updates PostgreSQL authentication configuration in the Docker container
# It addresses the "Peer authentication failed for user postgres" error
# Run this script from your project root directory with: bash scripts/fix-postgres-auth.sh

# Ensure the script is being run from the project root
if [ ! -f "docker-compose.yml" ]; then
  echo "Error: This script should be run from the project root directory"
  exit 1
fi

echo "Fixing PostgreSQL authentication issue..."

# Step 1: Copy the SQL script into the container
echo "Copying SQL script to PostgreSQL container..."
docker cp scripts/update-pg-auth.sql biosphere_alpha-db-1:/tmp/

# Step 2: Execute the SQL script in the container
echo "Executing SQL script in container..."
docker exec -u postgres biosphere_alpha-db-1 psql -f /tmp/update-pg-auth.sql

# Step 3: Modify pg_hba.conf directly if needed
echo "Updating pg_hba.conf..."
docker exec biosphere_alpha-db-1 bash -c "sed -i 's/local.*all.*postgres.*peer/local all postgres md5/g' \$(psql -t -c 'SHOW hba_file;' | xargs)"

# Step 4: Restart PostgreSQL inside the container
echo "Restarting PostgreSQL service..."
docker exec biosphere_alpha-db-1 pg_ctl -D /var/lib/postgresql/data reload

echo "Authentication configuration updated. Checking status..."

# Verify the changes
echo "Current authentication configuration:"
docker exec -u postgres biosphere_alpha-db-1 psql -c "SELECT * FROM pg_hba_file_rules;"

echo "Done! Try connecting to PostgreSQL now."