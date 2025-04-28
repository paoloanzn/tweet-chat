#!/bin/bash
set -e

# Check if BUILD_TARGET is provided as a command-line argument
if [ -z "$1" ]; then
  echo "Error: BUILD_TARGET must be provided as a command-line argument."
  echo "Usage: $0 <BUILD_TARGET>"
  echo "Example: $0 \"build:mac -- --dir\""
  exit 1
fi

# Set BUILD_TARGET from the first command-line argument
BUILD_TARGET="$1"

# Prepare the dist directory
rm -rf ./dist
mkdir -p ./dist
chmod 777 ./dist

# Run docker-compose with the specified BUILD_TARGET
BUILD_TARGET="$BUILD_TARGET" docker-compose run --rm build