# Sử dụng node làm base image
FROM node:20.12.2-bullseye-slim

# Tạo thư mục app trong container
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn vào thư mục app
COPY . .

# Expose port
EXPOSE 8020

# Chạy ứng dụng
CMD ["node", "server.js"]
