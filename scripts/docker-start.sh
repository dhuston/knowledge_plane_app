#!/bin/bash
# Simple script to start the application using docker-compose

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Make sure we're in the project root directory
cd "$(dirname "$0")/.." || exit 1

# Check if .env file exists, if not create it from template
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit the .env file with your own values if needed."
  else
    echo "Warning: No .env.example file found. You may need to create a .env file manually."
  fi
fi

# Start docker-compose
echo "Starting Biosphere Alpha services..."
docker-compose up "$@"