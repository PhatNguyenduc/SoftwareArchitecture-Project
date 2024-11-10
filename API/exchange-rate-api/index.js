const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CircuitBreaker = require("opossum");
const os = require("os");


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

// Cấu hình circuit breaker
const breakerOptions = {
  timeout: 5000, // thời gian tối đa cho một yêu cầu (5 giây)
  errorThresholdPercentage: 50, // ngưỡng lỗi cho phép là 50%
  resetTimeout: 10000, // thời gian chờ để thử lại sau khi breaker "ngắt" (10 giây)
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
  try {
    // Check the status of the API by calling the exchange rate function
    const exchangeRateStatus = await breaker.fire();
    res.status(200).json({
      status: "UP",   // Indicate both the container and endpoint, status = UP when container and endpoint are ok
      api: "exchange-rate",
      containerStatus: "Running",
      endpointStatus: "UP", // Monitor the status of api endpoints
      systemMetrics: {
        uptime: os.uptime(),
        memoryUsage: process.memoryUsage(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpuLoad: os.loadavg(),  // Average CPU load over the last 1, 5, and 15 minutes
      }
    });
  } catch (error) {
    // If the circuit breaker is open or there is an error, return a status of DOWN
    res.status(500).json({
      status: "PARTIALLY_UP",   // Indicate both the container and endpoint, status = UP when container and endpoint are ok
      api: "exchange-rate",
      containerStatus: "Error",
      endpointStatus: "DOWN",
      message: error.message,
      systemMetrics: {
        uptime: os.uptime(),
        memoryUsage: process.memoryUsage(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        cpuLoad: os.loadavg(),  // Average CPU load over the last 1, 5, and 15 minutes
      }
    });
  }
}); 

app.listen(port, () => {
  console.log(
    `Exchange Rate API is running on http://localhost:${port}/api/exchange-rate\n` +
    `Exchange Rate API Health Check is running on http://localhost:${port}/api/exchange-rate/health\n`
  );
});
