# --- Build phase ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Serve phase ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# วางคอมเมนต์บรรทัดนี้ แทนการแปะท้าย COPY
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80