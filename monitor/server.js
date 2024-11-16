const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");
const axios = require("axios");
const validAPIKey = "anhHiepDepTrai";

const app = express();
const port = 8020;

const exchangeRatePort = 3002;
const goldPricePort = 3001;

const exchangeRateApiHealthUrl = `http://exchange-rate-api:${exchangeRatePort}/api/exchange-rate/health`;
const goldApiHealthUrl = `http://gold-api:${goldPricePort}/api/gold-price/health`;

// const exchangeRateApiHealthUrl = `http://localhost:${exchangeRatePort}/api/exchange-rate/health`;
// const goldApiHealthUrl = `http://localhost:${goldPricePort}/api/gold-price/health`;

app.use(cors());

function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['api-key'] || req.query.apiKey;

  if (apiKey === validAPIKey) {
    return next();
  }
  return res.status(403).json({message: "Forbidden: Invalid API Key"})
}

async function getHealthInformation(url, apiName) {
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      return { data: response.data };
    } else if (response.status === 500 && response.data !== null) {
      // Partially operational: service is up but experiencing issues
      // console.log("exchangeRateApiHealthResponse", response);
      return { data: response.data };
    } else {
      console.error(
        `Error fetching ${apiName} health:`,
        error.message
      );
      // Fully down or unreachable
      return { data: null };
    } 
  } catch (error) {
    console.error(
      `Catching Error fetching ${apiName} health:`,
      error.message
    );
    return { data: null }; // Mark as down if request fails
  }
}

// Gateway routing 1: Exchange-rate-api
app.get("/exchange-rate-api/health", authenticateAPIKey, async (req, res) => {
  try {
    const exchangeRateApiHealthResponse = getHealthInformation(exchangeRateApiHealthUrl, "exchange-rate-api");
    res.status(200).json(exchangeRateApiHealthResponse);
  } catch (error) {
    console.error("Unexpected error in health check:", error.message);
    res.status(500).json({
      status: "DOWN",
      message: "An error occurred while get exchange-rate-api health checks.",
    });
  }
});

// Gateway routing 2: Gold-api
app.get("/gold-api/health", authenticateAPIKey, async (req, res) => {
  try {
    const goldApiHealthResponse = getHealthInformation(goldApiHealthUrl, "gold-api");
    res.status(200).json(goldApiHealthResponse);
  } catch (error) {
    console.error("Unexpected error in health check:", error.message);
    res.status(500).json({
      status: "DOWN",
      message: "An error occurred while get exchange-rate-api health checks.",
    });
  }
});

// GATEWAY AGGREGATION
// Aggregated health check for all endpoints
app.get("/api/health", authenticateAPIKey, async (req, res) => {
  try {
    // Make concurrent requests to both health endpoints
    const [exchangeRateApiHealthResponse, goldApiHealthResponse] =
      await Promise.all([
        // Wrapping each request with individual try-catch to handle partial failures
        (async () => {
          return getHealthInformation(exchangeRateApiHealthUrl, "exchange-rate-api");
        })(),
        (async () => {
          return getHealthInformation(goldApiHealthUrl, "gold-api");
        })(),
      ]);

    // Aggregate responses from both services
    const aggregatedStatus = {
      status: serverStatus, // Overall status
      exchangeRateApi: exchangeRateApiHealthResponse, // Individual service status
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
  console.log(`Server is running on http://localhost:${port}/api/health`);
});
