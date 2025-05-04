#!/bin/bash

# Script to run all demo tenant creation scripts in the Docker environment
# This ensures all required dependencies are available

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Navigate to the project root
cd "$PROJECT_ROOT"

# Run the Python scripts in the backend container
echo "========================================"
echo "Creating Pharma AI Demo tenant..."
echo "========================================"
docker-compose exec backend python /app/scripts/generate_test_data.py

echo "========================================"
echo "Creating Tech Innovations Inc. tenant..."
echo "========================================"
docker-compose exec backend python /app/scripts/create_tech_tenant.py

echo "========================================"
echo "Creating Metropolitan Health System tenant..."
echo "========================================"
docker-compose exec backend python /app/scripts/create_healthcare_tenant.py

echo "========================================"
echo "Creating Global Financial Group tenant..."
echo "========================================"
docker-compose exec backend python /app/scripts/create_financial_tenant.py

echo "========================================"
echo "Creating Advanced Manufacturing Corp tenant..."
echo "========================================"
docker-compose exec backend python /app/scripts/create_manufacturing_tenant.py

echo "========================================"
echo "Creating University Research Alliance tenant..."
echo "========================================"
docker-compose exec backend python /app/scripts/create_education_tenant.py

echo "========================================"
echo "All demo tenants created successfully!"
echo "========================================"