const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CircuitBreaker = require("opossum");
const os = require("os");
const fs = require("fs");
const { memoryUsage } = require("process");
const { resolve } = require("path");
const { rejects } = require("assert");

const app = express();
const port = 3001;

let requestCount = 0;
let reqpersec = 0;
let prevRequestCount = 0;
let curRequestCount = 0;
let prevRequestTime = Date.now();
let curRequestTime = Date.now();
app.use(cors());

app.use((req, res, next) => {
  if (req.method === "GET") {
    prevRequestCount = requestCount;
    requestCount++;
    curRequestCount = requestCount;

    prevRequestTime = curRequestTime;
    curRequestTime = Date.now();

    const timeDiff = (curRequestTime - prevRequestTime) / 1000; // Thời gian giữa các yêu cầu (giây)
    reqpersec =
      timeDiff > 0 ? (curRequestCount - prevRequestCount) / timeDiff : 0;
  }

  next();
});

// Định nghĩa một hàm cho API giá vàng
async function fetchGoldPrice() {
  const response = await axios.get(
    "http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v"
  );
  return response.data;
}

function getCpuUsage() {
  const cpuUsage = parseInt(
    fs.readFileSync("/sys/fs/cgroup/cpuacct/cpuacct.usage", "utf8")
  );
  return cpuUsage / 1e9; // Convert to seconds (since cpuacct.usage is in nanoseconds)

  // MacOS
  // const data = fs.readFileSync("/sys/fs/cgroup/cpu.stat", "utf8");
  // const lines = data.split("\n");
  // for (let line of lines) {
  //   if (line.startsWith("usage_usec")) {
  //     const value = line.split(" ")[1];
  //     return parseInt(value, 10) / 1e6;
  //   }
  // }
  // return null;
}

function getCpuUsagePercent() {
  return new Promise((resolve, rejects) => {
    try {
      const startCpuUsage = getCpuUsage();
      setTimeout(() => {
        const endCpuUsage = getCpuUsage();
        const cpuUsagePercent = (
          ((endCpuUsage - startCpuUsage) / 2) *
          100
        ).toFixed(2);
        resolve(cpuUsagePercent);
      }, 2000);
    } catch (error) {
      rejects(error);
    }
  });
}

// Cấu hình circuit breaker
const breakerOptions = {
  timeout: 15000, // thời gian tối đa cho một yêu cầu (15 giây)
  errorThresholdPercentage: 50, // ngưỡng lỗi cho phép là 50%
  resetTimeout: 20000, // thời gian chờ để thử lại sau khi breaker "ngắt" (10 giây)
};

const breaker = new CircuitBreaker(fetchGoldPrice, breakerOptions);

// Xử lý sự kiện khi circuit breaker mở
breaker.on("open", () =>
  console.warn("Circuit breaker is open. API requests are paused.")
);
breaker.on("halfOpen", () =>
  console.warn("Circuit breaker is half-open. Testing API again.")
);
breaker.on("close", () =>
  console.log("Circuit breaker is closed. API requests are operational.")
);

// API endpoint cho giá vàng
app.get("/api/gold-price", async (req, res) => {
  try {
    const data = await breaker.fire();
    res.json(data);
  } catch (error) {
    console.error("Error fetching gold price:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching gold price, circuit breaker engaged." });
  }
});

app.get("/api/gold-price/health", async (req, res) => {
  //Read memory
  let memoryUsageInMB = 0;
  try {
    const memoryUsage = fs.readFileSync(
      "/sys/fs/cgroup/memory/memory.usage_in_bytes",
      "utf8"
    );
    // const memoryUsage = fs.readFileSync(
    //   "/sys/fs/cgroup/memory.current",
    //   "utf8"
    // );

    // Convert memory usage to MB or GB for readability
    memoryUsageInMB = (parseInt(memoryUsage) / (1024 * 1024)).toFixed(2); // MB
  } catch (error) {
    memoryUsageInMB = NaN;
  }

  //Read cpu usage in 2s
  let cpuUsagePercent = 0.0;
  try {
    cpuUsagePercent = await getCpuUsagePercent();
    console.log(`CPU Usage Percent: ${cpuUsagePercent}%`);
  } catch (error) {
    console.log("Error calculating CPU usage:", error);
    cpuUsagePercent = NaN;
  }

  //Get transmitted and received network
  let networkReceivedMB = 0;
  let networkTransmittedMB = 0;
  try {
    const receivedBytes = fs.readFileSync(
      "/sys/class/net/eth0/statistics/rx_bytes",
      "utf8"
    ); // Received bytes
    const transmittedBytes = fs.readFileSync(
      "/sys/class/net/eth0/statistics/tx_bytes",
      "utf8"
    ); // Transmitted bytes

    networkReceivedMB = (parseInt(receivedBytes) / (1024 * 1024)).toFixed(2);
    networkTransmittedMB = (parseInt(transmittedBytes) / (1024 * 1024)).toFixed(
      2
    );
  } catch (error) {
    networkReceivedMB = NaN;
    networkTransmittedMB = NaN;
  }

  try {
    // Check the status of the API by calling the exchange rate function
    const goldPriceStatus = await breaker.fire();

    res.status(200).json({
      status: "UP", // Indicate both the container and endpoint, status = UP when container and endpoint are ok
      api: "gold-price",
      containerStatus: "UP",
      endpointStatus: "UP", // Monitor the status of api endpoints
      memoryUsageInMB: memoryUsageInMB,
      totalMemoryInMB: `${os.totalmem() / (1024 * 1024)}`,
      cpuUsagePercent: cpuUsagePercent,
      networkReceivedMB: networkReceivedMB,
      networkTransmittedMB: networkTransmittedMB,
      requestCount: requestCount,
      reqpersec: reqpersec,
    });
  } catch (error) {
    // If the circuit breaker is open or there is an error, return a status of DOWN
    res.status(200).json({
      status: "PARTIALLY_UP", // Indicate both the container and endpoint, status = UP when container and endpoint are ok
      api: "gold-price",
      containerStatus: "UP",
      endpointStatus: "DOWN",
      message: error.message,
      memoryUsageInMB: memoryUsageInMB,
      totalMemoryInMB: `${os.totalmem() / (1024 * 1024)}`,
      cpuUsagePercent: cpuUsagePercent,
      networkReceivedMB: networkReceivedMB,
      networkTransmittedMB: networkTransmittedMB,
      requestCount: requestCount,
      reqpersec: reqpersec,
    });
  }
});

app.listen(port, () => {
  console.log(
    `Gold Price API is running on http://localhost:${port}/api/gold-price\n` +
      `Gold Price API Health Check is running on http://localhost:${port}/api/gold-price/health\n`
  );
});
