#!/bin/sh
set -e

echo "--- Running Docker Entrypoint ---"

# Install dependencies if needed
echo "Checking dependencies..."
# Ensure npm ci runs if the node_modules volume was just created or is empty
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ] || [ "package-lock.json" -nt "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies with npm ci..."
    # Added flags for potentially faster/quieter CI installs
    npm ci --no-audit --prefer-offline --loglevel error
else
    echo "Dependencies seem up to date."
fi

# Build using the provided target (passed as env var)
if [ -z "$BUILD_TARGET" ]; then
    echo "Error: BUILD_TARGET environment variable is not set."
    exit 1
fi
echo "Running build target: $BUILD_TARGET"
npm run $BUILD_TARGET # Uses package.json scripts

echo "--- Docker Entrypoint Finished ---"