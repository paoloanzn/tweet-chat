FROM arm64v8/node:22.15-alpine AS builder

WORKDIR /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy package.json
COPY package.json* ./
RUN if [ -f package.json ]; then npm i; fi

# Copy the rest of the project
COPY . .

# Default build target
ARG BUILD_TARGET=build:all

RUN docker-entrypoint.sh

FROM alpine:latest
WORKDIR /output
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "cp -r /output/dist/ /host-dist"]