#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Error: BUILD_TARGET must be provided as a command-line argument."
  echo "Usage: $0 <BUILD_TARGET>"
  echo "Example: $0 \"build:mac -- --dir\"" # Example from your package.json
  exit 1
fi

BUILD_TARGET_ARG="$1"

# Prepare the output directories on the host
echo "Preparing host output directories..."
rm -rf ./dist ./dist-electron
mkdir -p ./dist ./dist-electron
# Permissions might be handled by Docker, adjust if needed
# chmod -R 777 ./dist ./dist-electron

echo "Running build container with BUILD_TARGET=${BUILD_TARGET_ARG}"

# Run docker-compose run, passing BUILD_TARGET via -e
# --rm removes the container after it exits
docker-compose run --rm --no-deps -e BUILD_TARGET="$BUILD_TARGET_ARG" build

echo "Build finished. Output should be in ./dist and ./dist-electron on the host."