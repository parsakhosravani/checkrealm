# Build stage: compile the Vite frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: small image with only production deps
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server

# Accounts, saves and the leaderboard live here — mount a volume to persist.
VOLUME /app/data
EXPOSE 3000
CMD ["node", "server/index.js"]
