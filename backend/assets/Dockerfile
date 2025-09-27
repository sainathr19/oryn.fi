# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock (or package-lock.json) to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install 

# Copy the rest of the application code to the working directory
COPY . .

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S orynuser -u 1001

# Change ownership of the app directory to the non-root user
RUN chown -R orynuser:nodejs /app
USER orynuser

# Expose the port that the application will run on
EXPOSE 3001

# Define the command to run the application
CMD ["npm", "start"]