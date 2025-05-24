#!/bin/bash

# Exit on error
set -e

# Start the application
NODE_ENV=production node dist/server/index.js 