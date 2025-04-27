FROM node:20

WORKDIR /app

# Install electron required deps (not necessary for build-only images)
RUN apt-get update && apt-get install \
    libx11-xcb1 libxcb-dri3-0 libxtst6 libnss3 libatk-bridge2.0-0 libgtk-3-0 libgtkextra-dev libgconf2-dev libasound2 libxtst-dev libxss1 libgbm1 \
    -y

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