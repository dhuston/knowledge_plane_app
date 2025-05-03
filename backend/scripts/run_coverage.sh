#!/bin/bash

# Script to run pytest with coverage for the backend

# Ensure the script fails on errors
set -e

# Check if we're in the backend directory
if [[ $(pwd) != *backend ]]; then
    echo "Please run this script from the backend directory"
    exit 1
fi

# Run pytest with coverage
python -m pytest --cov=app --cov-report=term --cov-report=html tests/ app/tests/

# Output location of HTML report
echo "HTML coverage report generated at: $(pwd)/htmlcov/index.html"