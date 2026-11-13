# ==========================================
# Stage 1: Build the Vite React Frontend
# ==========================================
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./
RUN npm ci

# Build args & env defaults
ARG VITE_API_URL=/api
ARG VITE_SUPABASE_URL=https://placeholder.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=dummy-key
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Copy full frontend source code and compile
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Production Server Runner
# ==========================================
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_NAME=Aparna_RMC_Db

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server application files
COPY server/ ./server/

# Copy compiled frontend assets to /app/dist (server/index.js serves ../dist)
COPY --from=frontend-builder /app/dist ./dist

# Create uploads directory for image evidence/captures
RUN mkdir -p /app/server/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "server/index.js"]
