const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 8020;

const exchangeRatePort = 3002;
const goldPricePort = 3001;

const exchangeRateApiHealthUrl = `http://exchange-rate-api:${exchangeRatePort}/api/exchange-rate/health`;
const goldApiHealthUrl = `http://gold-api:${goldPricePort}/api/gold-price/health`;

app.use(cors());

// GATEWAY AGGREGATION
// Aggregated health check for all endpoints
app.get("/api/health", async (req, res) => {
  try {
    // Make concurrent requests to both health endpoints
    const [exchangeRateApiHealthResponse, goldApiHealthResponse] = await Promise.all([
      // Wrapping each request with individual try-catch to handle partial failures
      (async () => {
        try {
          const response = await axios.get(exchangeRateApiHealthUrl);
          if (response.status === 200) {

            return { status: "UP", data: response.data };
          } else if (response.status === 500 && response.data) {

            // Partially operational: service is up but experiencing issues
            return { status: "PARTIALLY_UP", data: response.data };
          } else {
            console.error("Error fetching exchange-rate-api health:", error.message);
            // Fully down or unreachable
            return { status: "DOWN", data: null };
          }
        } catch (error) {
          console.error("Error fetching exchange-rate-api health:", error.message);
          return { status: "DOWN", data: null }; // Mark as down if request fails
        }
      })(),
      (async () => {
        try {
          const response = await axios.get(goldApiHealthUrl);
          if (response.status === 200) {

            return { status: "UP", data: response.data };
          } else if (response.status === 500 && response.data) {

            // Partially operational: service is up but experiencing issues
            return { status: "PARTIALLY_UP", data: response.data };
          } else {
            console.error("Error fetching gold-api health:", error.message);
            // Fully down or unreachable
            return { status: "DOWN", data: null };
          }
        } catch (error) {
          console.error("Error fetching gold-api health:", error.message);
          return { status: "DOWN", data: null }; // Mark as down if request fails
        }
      })(),
    ]);

    serverStatus = "UP"
    if (exchangeRateApiHealthResponse.status === "UP" && goldApiHealthResponse.status === "UP") {
      serverStatus = "UP"
    } else if (exchangeRateApiHealthResponse.status === "UP" || goldApiHealthResponse.status === "UP") {
      serverStatus = "PARTIALLY_UP"
    } else {
      serverStatus = "DOWN"
    }

    // Aggregate responses from both services
    const aggregatedStatus = {
      status: serverStatus, // Overall status
      exchangeRateApi: exchangeRateApiHealthResponse,  // Individual service status
      goldApi: goldApiHealthResponse,
    };

    res.status(200).json(aggregatedStatus);
  } catch (error) {
    // Handle unexpected errors (e.g., aggregation code issues, unexpected exceptions)
    console.error("Unexpected error in health aggregation:", error.message);
    res.status(500).json({
      status: "DOWN",
      message: "An error occurred while aggregating health checks.",
    });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
