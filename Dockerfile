# Dockerfile Multi-Stage - Gol de Ouro v1.1.1
# Otimizado para produção sem COPY . .

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Application
FROM node:20-alpine AS app
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only essential files
COPY package*.json ./
COPY server-fly.js ./server-fly.js
COPY db.js ./db.js
COPY database ./database
COPY controllers ./controllers
COPY routes ./routes
COPY services ./services
COPY middlewares ./middlewares
COPY utils ./utils
COPY config ./config

# Production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start application
CMD ["node","server-fly.js"]