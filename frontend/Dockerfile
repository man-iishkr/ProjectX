# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Vite/React application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built React application into the Nginx static HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Port 80 is exposed by default in the nginx:alpine image
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
