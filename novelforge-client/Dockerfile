# Stage 1: Build React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Pass API Gateway URL at build time (e.g. from Render or Docker Compose)
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ARG API_GATEWAY_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-$VITE_API_URL}
ENV VITE_API_URL=${VITE_API_URL:-$VITE_API_BASE_URL}
ENV API_GATEWAY_URL=${API_GATEWAY_URL:-https://novelforge-api-gateway.onrender.com}

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

CMD ["/bin/sh", "-c", "envsubst '$$API_GATEWAY_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;' "]

EXPOSE 80
