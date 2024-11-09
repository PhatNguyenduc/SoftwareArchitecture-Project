const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");
const axios = require('axios');

const app = express();
const port = 5000;

const exchangeRatePort = 3002;
const goldPricePort = 3001;

const exchangeRateApiHealthUrl = `http://localhost:${exchangeRatePort}/api/exchange-rate/health`;
const goldApiHealthUrl = `http://localhost:${goldPricePort}/api/gold-price/health`;

app.use(cors());

const docker = new Docker({ host: "localhost", port: 2375 });

// Lấy thông tin CPU và Memory của một container cụ thể
app.get("/api/container-stats/:containerId", async (req, res) => {
  const containerId = req.params.containerId;
  const container = docker.getContainer(containerId);

  try {
    const statsStream = await container.stats({ stream: false });
    const cpuUsage = calculateCPUUsage(statsStream);
    const memoryUsage = calculateMemoryUsage(statsStream);

    res.json({ cpu: cpuUsage, memory: memoryUsage });
  } catch (error) {
    console.error("Error fetching container stats:", error);
    res.status(500).json({ message: "Error fetching container stats" });
  }
});

// GATEWAY AGGREGATION
// Aggregated health check for all endpoints
app.get("/api/health", async (req, res) => {
  try {
    // Make concurrent requests to both health endpoints
    const [exchangeRateApiHealthResponse, goldApiHealthResponse] = await Promise.all([
      axios.get(exchangeRateApiHealthUrl),
      axios.get(goldApiHealthUrl),
    ]);

    // Aggregate responses from both services
    const aggregatedStatus = {
      status: (exchangeRateApiResponse.data.status === "UP" && goldApiResponse.data.status === "UP") ? "UP" : "DOWN", // Are all services ok?
      exchangeRateApi: exchangeRateApiHealthResponse.data,  // services bị down nhưng vẫn có thể gọi được
      goldApi: goldApiHealthResponse.data,
    };

    res.status(200).json(aggregatedStatus);
  } catch (error) {
    // Handle errors in case one or both services are down
    const errorResponse = {
      status: "DOWN",
      message: "One or more services are unavailable",
      exchangeRateApi: error.response && error.response.status === 500 ? { status: "DOWN" } : { status: "UP" },   // services không thể gọi tới - nên dùng DOWN hay DIE?
      goldApi: error.response && error.response.status === 500 ? { status: "DOWN" } : { status: "UP" }
    };

    res.status(500).json(errorResponse);
  }
});

// Endpoint lấy trạng thái tất cả các container
// app.get("/api/containers", async (req, res) => {
//   try {
//     const containers = await docker.listContainers({ all: true });
//     const containerStatuses = await Promise.all(
//       containers.map(async (containerInfo) => {
//         const container = docker.getContainer(containerInfo.Id);
//         const isRunning = containerInfo.State === "running";

//         // Tính toán response time cho mỗi container
//         const start = Date.now();
//         try {
//           await container.inspect(); // Kiểm tra xem container có đang chạy không
//           const end = Date.now();
//           const responseTime = end - start;

//           // Nếu container đang chạy, lấy stats của nó
//           let cpuUsage = 0;
//           let memoryUsage = 0;
//           if (isRunning) {
//             const statsStream = await container.stats({ stream: false });
//             cpuUsage = calculateCPUUsage(statsStream);
//             memoryUsage = calculateMemoryUsage(statsStream);
//           }

//           return {
//             id: containerInfo.Id,
//             name: containerInfo.Names[0].replace("/", ""),
//             status: isRunning ? "up" : "down",
//             cpu: cpuUsage,
//             memory: memoryUsage,
//             responseTime: `${responseTime} ms`,
//           };
//         } catch (error) {
//           console.error(
//             `Error fetching container ${containerInfo.Id} info:`,
//             error
//           );
//           return {
//             id: containerInfo.Id,
//             name: containerInfo.Names[0].replace("/", ""),
//             status: "unknown",
//             cpu: 0,
//             memory: 0,
//             responseTime: "N/A",
//           };
//         }
//       })
//     );

//     res.json(containerStatuses);
//   } catch (error) {
//     console.error("Error fetching containers:", error);
//     res.status(500).json({ message: "Error fetching containers" });
//   }
// });

// Hàm tính toán sử dụng CPU
function calculateCPUUsage(stats) {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

  const cpuUsage =
    systemDelta > 0
      ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0
      : 0.0;
  return cpuUsage.toFixed(2);
}

// Hàm tính toán sử dụng bộ nhớ
function calculateMemoryUsage(stats) {
  const usedMemory =
    (stats.memory_stats.usage - stats.memory_stats.stats.inactive_file) /
    (1000 * 1000);
  const totalMemory = stats.memory_stats.limit / (1024 * 1024 * 1024);

  return usedMemory.toFixed(2) + " MB / " + totalMemory.toFixed(2) + " GB";
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
