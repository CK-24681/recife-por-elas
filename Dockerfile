# syntax=docker/dockerfile:1
# Build do frontend (React + Vite)
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build do backend (Node + Express + TypeScript)
FROM node:24-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Imagem final (enxuta: só o necessário pra rodar)
FROM node:24-alpine
WORKDIR /app/backend
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend /app/backend/dist ./dist
COPY --from=frontend /app/frontend/dist /app/frontend/dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
