# Sử dụng node làm base image
FROM node:20.12.2


# Tạo thư mục app trong container
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn vào thư mục app
COPY . .

# Expose port
EXPOSE 3001

# Chạy ứng dụng
CMD ["node", "index.js"]
