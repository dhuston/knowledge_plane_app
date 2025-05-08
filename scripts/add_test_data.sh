#!/bin/bash
# Run the script to add test data for map visualization

docker exec "$(docker ps | grep biosphere_alpha-backend | awk '{print $1}')" python -m app.scripts.add_test_data