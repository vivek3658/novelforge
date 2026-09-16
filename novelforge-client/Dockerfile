# Stage 1: Build React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Pass API Gateway URL at build time (e.g. from Render or Docker Compose)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
