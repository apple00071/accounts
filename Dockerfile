FROM node:18-slim

WORKDIR /app

# Install OpenSSL and other dependencies
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY backend/prisma ./backend/prisma/

# Install root dependencies first
RUN npm install

# Install backend dependencies and generate Prisma client
WORKDIR /app/backend
RUN npm install
RUN npx prisma generate

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Back to root directory
WORKDIR /app

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 