const express = require("express");
const axios = require("axios");
const Docker = require("dockerode");
const cors = require("cors");
const os = require("os-utils");

const app = express();
const port = 5000;

app.use(cors()); // Enable all CORS requests

// Tạo một instance của Docker
const docker = new Docker();

// Kiểm tra trạng thái container
app.get("/api/container-status", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const statuses = containers.map((container) => ({
      id: container.Id,
      name: container.Names[0].replace("/", ""), // Lấy tên container
      status: container.State, // Lấy trạng thái container (up/down)
    }));
    res.json(statuses);
    console.log(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching container status" });
  }
});

// Kiểm tra trạng thái API endpoint
app.get("/api/endpoint-status", async (req, res) => {
  try {
    const goldPriceResponse = await axios.get(
      "http://localhost:3001/api/gold-price"
    );
    const exchangeRateResponse = await axios.get(
      "http://localhost:3002/api/exchange-rate"
    );

    const statuses = {
      "Gold Price API": goldPriceResponse.status === 200 ? "up" : "down",
      "Exchange Rate API": exchangeRateResponse.status === 200 ? "up" : "down",
    };
    res.json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching API status" });
  }
});

// Hiển thị tài nguyên máy chủ
app.get("/api/server-resources", (req, res) => {
  os.cpuUsage((cpuUsage) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    res.json({
      cpuUsage,
      totalMem,
      freeMem,
      usedMem,
      freeMemPercentage: (freeMem / totalMem) * 100,
      usedMemPercentage: (usedMem / totalMem) * 100,
    });
  });
});

// Example data
let trafficData = {
  data: [0, 10, 20, 30, 40, 50],
  labels: ["1s", "2s", "3s", "4s", "5s", "6s"],
};

app.get("/api/traffic-data", (req, res) => {
  res.json(trafficData);
});

// Chạy server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
