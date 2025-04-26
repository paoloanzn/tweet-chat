#!/bin/sh
set -e

# Initialize project if no package.json
if [ ! -f package.json ]; then
  echo "Initializing new node project..."
  npm init -y
fi

# Install dependencies if package.json changed
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
	npm i
fi

exec "$@"