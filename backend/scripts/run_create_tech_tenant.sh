#!/bin/bash

# Script to run the create_tech_tenant.py script in the Docker environment
# This ensures all required dependencies are available

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Navigate to the project root
cd "$PROJECT_ROOT"

# Run the Python script in the backend container
echo "Creating Tech Innovations Inc. tenant..."
docker-compose exec backend python /app/scripts/create_tech_tenant.py

echo "Done!"