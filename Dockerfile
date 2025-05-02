FROM arm64v8/node:22.15-alpine

WORKDIR /app

# Copy entrypoint script first
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy only package files
COPY package.json package-lock.json* ./

# Copy the rest of the application code (respecting .dockerignore)
COPY . .

# Set the entrypoint that handles setup and build
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]