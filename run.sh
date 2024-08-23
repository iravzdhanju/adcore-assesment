#!/bin/bash

# Stop all running containers
echo "Stopping all running containers..."
docker-compose down

# Remove old images (optional, uncomment if needed)
# echo "Removing old images..."
# docker-compose rm -f

# Build the images
echo "Building Docker images..."
docker-compose build

# Start the containers
echo "Starting containers..."
docker-compose up

# To run in detached mode, use the following line instead:
# docker-compose up -d

# If running in detached mode, you might want to follow the logs:
# docker-compose logs -f