# frontend.Dockerfile
# Build stage to build Vite app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json to leverage caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ .

# Set default API URL placeholder so we can optionally override it via build arguments
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend bundle
RUN npm run build

# Serve stage using lightweight Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
