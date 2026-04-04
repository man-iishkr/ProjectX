# Stage 1: Build & Bundle
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package configuration
COPY package*.json ./

# Install all dependencies (including dev tools for ncc)
RUN npm install
RUN npm install date-fns # explicitly install missing module so ncc can find it
RUN npm install -g @vercel/ncc

# Copy the actual source code
COPY . .

# Bundle the entire application into a single compiled directory (dist)
# This obfuscates and minifies the code, ensuring original sources aren't deployed
RUN ncc build src/server.js -o dist -m

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /usr/src/app

# We need to copy the entire dist folder because ncc might emit additional files or native addons
COPY --from=builder /usr/src/app/dist ./dist

# Set Node environment to production
ENV NODE_ENV=production

# The port Nginx will talk to
EXPOSE 5000

# Run the bundled application
CMD ["node", "dist/index.js"]
