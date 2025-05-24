#!/bin/bash

# Exit on error
set -e

# Print each command before executing
set -x

# Ensure we're using Node.js
echo "Node.js version:"
node --version

# Install dependencies
npm install

# Generate Prisma client
npm run postinstall

# Build the application
npm run build

# Make the start script executable
chmod +x start.sh 