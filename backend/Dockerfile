FROM node:18-bookworm-slim

WORKDIR /app

# -----------------------------
# Install system dependencies
# -----------------------------
RUN apt-get update && apt-get install -y \
    openssl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# Copy package files
# -----------------------------
COPY package*.json ./

# Install dependencies
RUN npm install

# -----------------------------
# Copy Prisma schema FIRST
# (needed before prisma generate)
# -----------------------------
COPY prisma ./prisma

# Generate Prisma Client at BUILD time
RUN npx prisma generate

# -----------------------------
# Copy application source
# -----------------------------
COPY . .

# Build Typescript
RUN npm run build

# -----------------------------
# Runtime
# -----------------------------
EXPOSE 3001

# IMPORTANT:
# Run migrations THEN start API
CMD sh -c "npx prisma migrate deploy && node dist/index.js"
