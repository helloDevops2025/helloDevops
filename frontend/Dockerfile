# --- Build phase ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# คัดลอก source code ทั้งหมด
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# ✅ ใช้ ARG เพื่อเลือก mode
ARG MODE=production
RUN npm run build -- --mode $MODE

# --- Serve phase ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# วางคอมเมนต์บรรทัดนี้ แทนการแปะท้าย COPY
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80