FROM node:20-slim

# תלויות Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

# שמירת Session (mount volume בפרודקשן)
VOLUME ["/app/.wwebjs_auth"]

EXPOSE 3001

CMD ["node", "index.js"]
