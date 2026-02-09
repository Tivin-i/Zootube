# Multi-stage Dockerfile for Next.js application
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time args for NEXT_PUBLIC_* (inlined into client bundle; pass real values when building)
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Fail early if still using placeholders (so .env wasn't passed into build)
RUN if [ "$NEXT_PUBLIC_SUPABASE_URL" = "https://placeholder.supabase.co" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "placeholder" ]; then \
  echo "ERROR: Supabase is still using placeholders. Build args were not passed."; \
  echo "1. Create .env in the SAME directory as docker-compose.yml (see .env.example)"; \
  echo "2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your real values"; \
  echo "3. Run: ./scripts/docker-build.sh (from project root)"; \
  exit 1; \
fi
# So we can confirm in build logs that args were passed (length only, no leak)
RUN echo "Build: NEXT_PUBLIC_SUPABASE_URL length=${#NEXT_PUBLIC_SUPABASE_URL}"

# Build Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Note: Next.js standalone output includes node_modules and server.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
