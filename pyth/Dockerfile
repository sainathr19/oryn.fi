# Use the official Node.js image
FROM node:18-alpine

WORKDIR /app

# Install the required dependencies: Python, make, and g++
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
  && npm install -g typescript ts-node
  
# Copy the package.json and yarn.lock to the container
COPY package.json yarn.lock ./

# Install project dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN yarn build

# Clean up build dependencies
RUN apk del .build-deps

# Install only production dependencies
RUN yarn install --frozen-lockfile --production=true

CMD ["yarn", "start"]