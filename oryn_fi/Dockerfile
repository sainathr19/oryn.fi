# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    make \
    g++ \
    python3 \
    py3-pip \
    linux-headers \
    pkgconfig \
    git

# Set environment variables for native builds
ENV PYTHON=/usr/bin/python3
ENV MAKE=/usr/bin/make
ENV CC=gcc
ENV CXX=g++

# Enable corepack and set up yarn
RUN corepack enable && corepack prepare yarn@4.5.1 --activate

# Copy package files for dependency caching
COPY package.json yarn.lock .yarnrc.yml ./

# Configure yarn for optimal performance
RUN yarn config set nodeLinker node-modules && \
    yarn config set enableGlobalCache false

# Install dependencies with cache mount
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn config set cacheFolder /usr/local/share/.cache/yarn && \
    yarn install --immutable --inline-builds

# Set build environment variables
ARG VITE_UNI_V3_POSITION_MANAGER_ADDRESS
ARG VITE_ENVIRONMENT

ENV VITE_UNI_V3_POSITION_MANAGER_ADDRESS=${VITE_UNI_V3_POSITION_MANAGER_ADDRESS}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}

# Production build settings
ENV NODE_ENV=production
ENV CI=true
ENV GENERATE_SOURCEMAP=false

# Performance optimizations
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV MAKEFLAGS="-j$(nproc)"

# Copy source code
COPY . .

# Build the application
RUN --mount=type=cache,target=/app/node_modules/.vite \
    --mount=type=cache,target=/app/node_modules/.cache \
    vite build --mode production --minify esbuild

# ============================================================================
FROM nginx:1.27-alpine AS production

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx for SPA
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    \n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    \n\
    # Enable gzip compression\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;\n\
    \n\
    location / {\n\
        try_files $uri $uri.html $uri/ /index.html;\n\
    }\n\
    \n\
    # Cache static assets\n\
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|otf|wasm)$ {\n\
        expires 1y;\n\
        access_log off;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
    \n\
    # Security headers\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    }\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
