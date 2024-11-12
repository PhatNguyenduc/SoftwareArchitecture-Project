const { exec } = require("child_process");

// Hàm để chạy lệnh docker-compose
function runDockerCompose() {
  const command = "docker-compose up --build -d"; // Lệnh để chạy docker-compose

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Lỗi khi chạy lệnh: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Lỗi tiêu chuẩn: ${stderr}`);
      return;
    }
    console.log(`Kết quả: ${stdout}`);
  });
}

// Gọi hàm để chạy docker-compose
runDockerCompose();
