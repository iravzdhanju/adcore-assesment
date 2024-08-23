#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check if required environment variables are set
if [ -z "$MONGODB_USERNAME" ] || [ -z "$MONGODB_PASSWORD" ]; then
    echo "Error: MONGODB_USERNAME and MONGODB_PASSWORD must be set in .env file"
    exit 1
fi

# Start the containers
docker-compose -f docker-compose.prod.yml up -d --build

echo "Production environment started successfully"