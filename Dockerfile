# Multi-stage Dockerfile for Next.js with Prisma and MySQL
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# Stage 2: Rebuild the source code
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install prisma CLI globally with the exact version from package.json for migrations
RUN npm install -g prisma@6.11.1

# Copy standalone build files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Startup command: wait for MySQL to start using a robust Node.js script, run database push, and start application
CMD ["sh", "-c", "until node -e \"const net = require('net'); const client = net.connect({port: 3306, host: 'db'}, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1));\"; do echo 'Waiting for MySQL database connection...'; sleep 2; done && prisma db push --accept-data-loss && node server.js"]
