require("dotenv").config();
const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");
const axios = require("axios");
const sendEmailNotification = require("./sidecar/emailNotification");
const validAPIKey = process.env.API_KEY;


const app = express();
const port = 8020;

const exchangeRatePort = 3002;
const goldPricePort = 3001;

const exchangeRateApiHealthUrl = `http://exchange-rate-api:${exchangeRatePort}/api/exchange-rate/health`;
const goldApiHealthUrl = `http://gold-api:${goldPricePort}/api/gold-price/health`;

const coolDownTime = 1000 * 60 * 10; // 10 min
var exchangeRateNotificationTimePoint = 0;
var goldNotificationTimePoint = 0;

// const exchangeRateApiHealthUrl = `http://localhost:${exchangeRatePort}/api/exchange-rate/health`;
// const goldApiHealthUrl = `http://localhost:${goldPricePort}/api/gold-price/health`;

app.use(cors());

//localhost:port//api/health?api_key=anhHiepDepTrai
function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['api-key'] || req.query.apiKey;

  if (apiKey === validAPIKey) {
    return next();
  }
  return res.status(403).json({message: "Forbidden: Invalid API Key"})
}

// Helper function to validate email
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/; // Basic email validation regex
  return emailRegex.test(email);
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
  const clientEmail = req.headers['dest-email'];
  let validEmail = validateEmail(clientEmail);

  try {
    const exchangeRateApiHealthResponse = getHealthInformation(exchangeRateApiHealthUrl, "exchange-rate-api");
    if (validEmail) {
      let exchangeRateApiStatus = (exchangeRateApiHealthResponse.data?.status) ?? "DOWN";
      if (exchangeRateApiStatus !== "UP"
        && (Date.now() - exchangeRateNotificationTimePoint >= coolDownTime)) {
          sendEmailNotification("exchange-rate-api", exchangeRateApiStatus, clientEmail);
          exchangeRateNotificationTimePoint = Date.now();
      }
    }
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
  const clientEmail = req.headers['dest-email'];
  let validEmail = validateEmail(clientEmail);
  try {
    const goldApiHealthResponse = getHealthInformation(goldApiHealthUrl, "gold-api");
    if (validEmail) {
      let goldApiStatus = (goldApiHealthResponse.data?.status) ?? "DOWN";
      if (goldApiStatus !== "UP"
        && (Date.now() - goldNotificationTimePoint >= coolDownTime)) {
          sendEmailNotification("gold-api", goldApiStatus, clientEmail);
          goldNotificationTimePoint = Date.now();
      }
    }
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
  const clientEmail = req.headers['dest-email'];
  let validEmail = validateEmail(clientEmail);

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

    serverStatus = "UP";
    if (
      exchangeRateApiHealthResponse.data?.status === "UP" &&
      goldApiHealthResponse.data?.status === "UP"
    ) {
      serverStatus = "UP";
    } else if (
      exchangeRateApiHealthResponse.data?.status === "UP" ||
      goldApiHealthResponse.data?.status === "UP"
    ) {
      serverStatus = "PARTIALLY_UP";
    } else {
      serverStatus = "DOWN";
    }

    if (validEmail) {
      let exchangeRateApiStatus = (exchangeRateApiHealthResponse.data?.status) ?? "DOWN";
      let goldApiStatus = (goldApiHealthResponse.data?.status) ?? "DOWN";
      if (exchangeRateApiStatus !== "UP"
        && (Date.now() - exchangeRateNotificationTimePoint >= coolDownTime)) {
          sendEmailNotification("exchange-rate-api", exchangeRateApiStatus, clientEmail);
          exchangeRateNotificationTimePoint = Date.now();
      } else if (goldApiStatus !== "UP"
        && (Date.now() - goldNotificationTimePoint >= coolDownTime)) {
          sendEmailNotification("gold-api", goldApiStatus, clientEmail);
          goldNotificationTimePoint = Date.now();
      }
    }
  

    // Aggregate responses from both services
    const aggregatedStatus = {
      status: serverStatus, // Overall status
      exchangeRateApi: exchangeRateApiHealthResponse, // Individual service status
      goldApi: goldApiHealthResponse,
      message: `Fetch data successfully. Email is ${clientEmail ? (validEmail ? "valid" : "not valid") : "empty"}`,
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
