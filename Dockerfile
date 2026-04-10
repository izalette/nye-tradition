# Node included — use this if `node` / `npm` do not work on your Mac.
# Install Docker Desktop, then from this folder: docker compose up --build

FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["npm", "start"]
