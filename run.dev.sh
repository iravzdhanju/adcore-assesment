#!/bin/bash

# Stop all running containers
echo "Stopping all running containers..."
docker-compose down

# Build the images
echo "Building Docker images..."
docker-compose build

# Start the containers
echo "Starting containers..."
docker-compose up