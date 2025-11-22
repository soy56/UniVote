# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy backend and frontend directories
COPY backend ./backend
COPY frontend ./frontend

# Install dependencies for both (using the root script)
RUN npm run install-all

# Build the frontend (using the root script)
RUN npm run build

# Expose port 8080 (Google Cloud Run default)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
