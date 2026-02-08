FROM node:18-bookworm-slim

WORKDIR /app

# Install required system packages
RUN apt-get update && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema FIRST
COPY prisma ./prisma

# 🔥 VERY IMPORTANT
# Generate Prisma client during build time
RUN npx prisma generate

# Copy application source
COPY . .

# Build Typescript
RUN npm run build

# Expose API port
EXPOSE 9000

# 🔥 CRITICAL CHANGE:
# Run migrations THEN start app
# Use exec form so signals propagate correctly
CMD sh -c "npx prisma migrate deploy && node dist/index.js"
