FROM oven/bun:latest

WORKDIR /app

# Copy initialization script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Install dependencies first (if they exist)
COPY package.json* bun.lockb* ./
RUN if [ -f package.json ]; then bun install; fi

# Copy source code
COPY . .

ENTRYPOINT ["docker-entrypoint.sh"]
