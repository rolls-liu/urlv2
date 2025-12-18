# 阶段1: 构建前端
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV REACT_APP_API_URL=
RUN npm run build

# 阶段2: 构建后端
FROM node:18-alpine AS backend-builder
# 安装 Python 和构建工具（better-sqlite3 需要编译）
RUN apk add --no-cache python3 make g++
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# 阶段3: 最终镜像
FROM node:18-alpine
WORKDIR /app

# 安装 nginx
RUN apk add --no-cache nginx

# 复制后端
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY server/index.js ./server/
COPY server/package.json ./server/

# 复制前端构建产物
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# 配置 nginx
RUN mkdir -p /run/nginx && \
    echo 'server {' > /etc/nginx/http.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/http.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/http.d/default.conf && \
    echo '    location / {' >> /etc/nginx/http.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/http.d/default.conf && \
    echo '        index index.html index.htm;' >> /etc/nginx/http.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_pass http://127.0.0.1:3001;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/http.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/http.d/default.conf && \
    echo '    }' >> /etc/nginx/http.d/default.conf && \
    echo '}' >> /etc/nginx/http.d/default.conf

# 创建启动脚本
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/server && node index.js &' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

# 创建数据目录
RUN mkdir -p /app/server/data
VOLUME ["/app/server/data"]

EXPOSE 80

CMD ["/app/start.sh"]
