# Stage 1: Build the Angular app
FROM node:20 AS build
WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source code and build
COPY frontend/ .
# Note: In a real scenario, you might want to replace environment.prod.ts with real values here
RUN npm run build:prod

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/docvault-frontend/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
