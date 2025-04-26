FROM node:20

WORKDIR /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy package.json and package-lock.json
COPY package.json* package-lock.json* ./
RUN if [ -f package.json ]; then npm i; fi

# Copy the rest of the project
COPY . .

EXPOSE 5173

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/bin/bash"]