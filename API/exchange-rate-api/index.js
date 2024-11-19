const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CircuitBreaker = require("opossum");
const os = require("os");
const fs = require("fs");
const { resolve } = require("path");
const { rejects } = require("assert");

const app = express();
const port = 3002;

app.use(cors());

// Định nghĩa một hàm cho API tỷ giá ngoại tệ
async function fetchExchangeRate() {
  const response = await axios.get(
    "https://www.vietcombank.com.vn/api/exchangerates?date=now"
  );
  return response.data;
}

function getCpuUsage() {
  // const cpuUsage = parseInt(
  //   fs.readFileSync("/sys/fs/cgroup/cpuacct/cpuacct.usage", "utf8")
  // );
  // return cpuUsage / 1e9; // Convert to seconds (since cpuacct.usage is in nanoseconds)
  const data = fs.readFileSync("/sys/fs/cgroup/cpu.stat", "utf8");
  const lines = data.split("\n");
  for (let line of lines) {
    if (line.startsWith("usage_usec")) {
      const value = line.split(" ")[1];
      return parseInt(value, 10) / 1e6;
    }
  }
  return null;
}

function getCpuUsagePercent() {
  return new Promise((resolve, rejects) => {
    try {
      const startCpuUsage = getCpuUsage();
      setTimeout(() => {
        const endCpuUsage = getCpuUsage();
        const cpuUsagePercent = (
          ((endCpuUsage - startCpuUsage) / 1) *
          100
        ).toFixed(2);
        resolve(cpuUsagePercent);
      }, 1000);
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

const breaker = new CircuitBreaker(fetchExchangeRate, breakerOptions);

// Xử lý sự kiện khi circuit breaker mở, đóng, và half-open
breaker.on("open", () =>
  console.warn("Circuit breaker is open. API requests are paused.")
);
breaker.on("halfOpen", () =>
  console.warn("Circuit breaker is half-open. Testing API again.")
);
breaker.on("close", () =>
  console.log("Circuit breaker is closed. API requests are operational.")
);

// API endpoint cho tỷ giá ngoại tệ
app.get("/api/exchange-rate", async (req, res) => {
  try {
    const data = await breaker.fire();
    res.json(data);
  } catch (error) {
    console.error("Error fetching exchange rate:", error.message);
    res.status(500).json({
      message: "Error fetching exchange rate, circuit breaker engaged.",
    });
  }
});

app.get("/api/exchange-rate/health", async (req, res) => {
  //Read memory usage
  let memoryUsageInMB = 0;
  try {
    // const memoryUsage = fs.readFileSync(
    //   "/sys/fs/cgroup/memory/memory.usage_in_bytes",
    //   "utf8"
    // );

    const memoryUsage = fs.readFileSync(
      "/sys/fs/cgroup/memory.current",
      "utf8"
    );

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
    const exchangeRateStatus = await breaker.fire();
    res.status(200).json({
      status: "UP", // Indicate both the container and endpoint, status = UP when container and endpoint are ok
      api: "exchange-rate",
      containerStatus: "UP",
      endpointStatus: "UP", // Monitor the status of api endpoints
      memoryUsageInMB: memoryUsageInMB,
      totalMemoryInMB: `${os.totalmem() / (1024 * 1024)}`,
      cpuUsagePercent: cpuUsagePercent,
      networkReceivedMB: networkReceivedMB,
      networkTransmittedMB: networkTransmittedMB,
    });
  } catch (error) {
    // If the circuit breaker is open or there is an error, return a status of DOWN
    res.status(200).json({
      status: "PARTIALLY_UP", // Indicate both the container and endpoint, status = UP when container and endpoint are ok
      api: "exchange-rate",
      containerStatus: "UP",
      endpointStatus: "DOWN",
      message: error.message,
      memoryUsageInMB: memoryUsageInMB,
      totalMemoryInMB: `${os.totalmem() / (1024 * 1024)}`,
      cpuUsagePercent: cpuUsagePercent,
      networkReceivedMB: networkReceivedMB,
      networkTransmittedMB: networkTransmittedMB,
    });
  }
});

app.listen(port, () => {
  console.log(
    `Exchange Rate API is running on http://localhost:${port}/api/exchange-rate\n` +
      `Exchange Rate API Health Check is running on http://localhost:${port}/api/exchange-rate/health\n`
  );
});
