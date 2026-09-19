# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set default standalone API URL and Supabase URL
ENV VITE_API_URL=http://200.234.36.120:5050/api/v1
ENV VITE_SUPABASE_URL=http://200.234.36.120:8000
RUN npm run build

# Serve stage with lightweight Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
