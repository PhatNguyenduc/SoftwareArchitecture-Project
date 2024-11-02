const express = require("express");
const axios = require("axios");
const cors = require("cors");
const os = require("os-utils");
const Docker = require("dockerode");
const healthcheck = require("express-healthcheck");
const { HealthCheck } = require("node-health-check");
const si = require("systeminformation");
const { exec } = require("child_process");

const app = express();
const port = 5000;

app.use(cors());
app.use("/healthcheck", healthcheck());
const docker = new Docker();

// Kiểm tra trạng thái container
app.get("/api/container-status", async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const statuses = containers.map((container) => ({
      id: container.Id,
      name: container.Names[0].replace("/", ""),
      status: container.State, // Lấy trạng thái container (up/down)
    }));
    res.json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching container status" });
  }
});

// API để lấy trạng thái của containers
// app.get("/api/container-status", async (req, res) => {
//   try {
//     const containers = ["gold-price-container", "exchange-rate-container"];
//     const statuses = await Promise.all(containers.map(checkContainerStatus));
//     const result = containers.map((name, index) => ({
//       name,
//       status: statuses[index],
//     }));
//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching container status" });
//   }
// });

// Kiểm tra tình trạng API endpoint
const checkApiStatus = async (url) => {
  try {
    const response = await axios.get(url);
    return response.status === 200 ? "up" : "down";
  } catch {
    return "down";
  }
};

// API để lấy trạng thái của các endpoint
app.get("/api/endpoint-status", async (req, res) => {
  try {
    const endpoints = [
      "http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v",
      "https://www.vietcombank.com.vn/api/exchangerates?date=now",
    ];
    const statuses = await Promise.all(endpoints.map(checkApiStatus));
    const result = endpoints.map((url, index) => ({
      url,
      status: statuses[index],
    }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching endpoint status" });
  }
});

// Hiển thị tài nguyên máy chủ
app.get("/api/resources", async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    res.json({
      cpuLoad: cpu.currentLoad,
      freeMemory: mem.available,
      totalMemory: mem.total,
    });
  } catch (error) {
    res.status(500).send("Error fetching resource info");
  }
});

//Xay dung luu luong truy cap

// Bắt đầu server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
