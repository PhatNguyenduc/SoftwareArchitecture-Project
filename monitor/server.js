require("dotenv").config();
const express = require("express");
const Docker = require("dockerode");
const cors = require("cors");
const axios = require("axios");
const sendEmailNotification = require("./sidecar/emailNotification");
const validAPIKey = process.env.API_KEY ?? "none";

const app = express();
const port = 8020;

const exchangeRatePort = 3002;
const goldPricePort = 3001;

// const exchangeRateApiHealthUrl =
//   "https://softwarearchitecture-project-exchange.onrender.com/api/exchange-rate/health";
// const goldApiHealthUrl = `https://softwarearchitecture-project-gold.onrender.com/api/gold-price/health`;

const exchangeRateApiHealthUrl = `http://exchange-rate-api:${exchangeRatePort}/api/exchange-rate/health`;
const goldApiHealthUrl = `http://gold-api:${goldPricePort}/api/gold-price/health`;

const coolDownTime = 1000 * 60 * 10; // 10 min
var exchangeRateNotificationTimePoint = 0;
var goldNotificationTimePoint = 0;

// const exchangeRateApiHealthUrl = `http://localhost:${exchangeRatePort}/api/exchange-rate/health`;
// const goldApiHealthUrl = `http://localhost:${goldPricePort}/api/gold-price/health`;

app.use(cors());

let healthCache = {
  exchangeRateApi: {
    data: null,
    responseTime: 0,
  },
  goldApi: {
    data: null,
    responseTime: 0,
  },
};

async function updateExchangeRateHealth() {
  const responseTime = Date.now();
  const result = await getHealthInformation(
    exchangeRateApiHealthUrl,
    "exchange-rate-api"
  );
  healthCache.exchangeRateApi = {
    data: result.data,

    responseTime: Date.now() - responseTime,
  };
}

async function updateGoldApiHealth() {
  const responseTime = Date.now();
  const result = await getHealthInformation(goldApiHealthUrl, "gold-api");
  healthCache.goldApi = {
    data: result.data,

    responseTime: Date.now() - responseTime,
  };
}
setInterval(updateExchangeRateHealth, 5000);
setInterval(updateGoldApiHealth, 5000);

//localhost:port//api/health?api_key=anhHiepDepTrai
function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers["api-key"] || req.query.apiKey;

  if (apiKey === validAPIKey) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Invalid API Key" });
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
      return { data: response.data };
    } else {
      console.error(`Error fetching ${apiName} health:`, error.message);
      // Fully down or unreachable
      return { data: null };
    }
  } catch (error) {
    console.error(`Catching Error fetching ${apiName} health:`, error.message);
    return { data: null }; // Mark as down if request fails
  }
}

// Gateway routing 1: Exchange-rate-api
app.get("/exchange-rate-api/health", authenticateAPIKey, async (req, res) => {
  const clientEmail = req.headers["dest-email"];
  let validEmail = validateEmail(clientEmail);
  let responseTime = Date.now();
  if (validEmail) {
    let status = healthCache.exchangeRateApi.data?.status ?? "DOWN";
    if (
      status !== "UP" &&
      Date.now() - exchangeRateNotificationTimePoint >= coolDownTime
    ) {
      sendEmailNotification("exchange-rate-api", status, clientEmail);
      exchangeRateNotificationTimePoint = Date.now();
    }
  }

  res.status(200).json({
    data: healthCache.exchangeRateApi.data,
    responseTime: healthCache.exchangeRateApi.responseTime,
  });
});

// Gateway routing 2: Gold-api
app.get("/gold-api/health", authenticateAPIKey, async (req, res) => {
  const clientEmail = req.headers["dest-email"];
  let validEmail = validateEmail(clientEmail);

  if (validEmail) {
    let status = healthCache.goldApi.data?.status ?? "DOWN";
    if (
      status !== "UP" &&
      Date.now() - goldNotificationTimePoint >= coolDownTime
    ) {
      sendEmailNotification("gold-api", status, clientEmail);
      goldNotificationTimePoint = Date.now();
    }
  }

  res.status(200).json({
    data: healthCache.goldApi.data,
    responseTime: healthCache.goldApi.responseTime,
  });
});

// GATEWAY AGGREGATION
// Aggregated health check for all endpoints
app.get("/api/health", authenticateAPIKey, async (req, res) => {
  const clientEmail = req.headers["dest-email"];
  let validEmail = validateEmail(clientEmail);

  if (validEmail) {
    let exchangeRateStatus = healthCache.exchangeRateApi.data?.status ?? "DOWN";
    let goldStatus = healthCache.goldApi.data?.status ?? "DOWN";

    if (
      exchangeRateStatus !== "UP" &&
      Date.now() - exchangeRateNotificationTimePoint >= coolDownTime
    ) {
      sendEmailNotification(
        "exchange-rate-api",
        exchangeRateStatus,
        clientEmail
      );
      exchangeRateNotificationTimePoint = Date.now();
    } else if (
      goldStatus !== "UP" &&
      Date.now() - goldNotificationTimePoint >= coolDownTime
    ) {
      sendEmailNotification("gold-api", goldStatus, clientEmail);
      goldNotificationTimePoint = Date.now();
    }
  }

  let serverStatus = "UP";
  if (
    healthCache.exchangeRateApi.data?.status === "UP" &&
    healthCache.goldApi.data?.status === "UP"
  ) {
    serverStatus = "UP";
  } else if (
    healthCache.exchangeRateApi.data?.status === "UP" ||
    healthCache.goldApi.data?.status === "UP"
  ) {
    serverStatus = "PARTIALLY_UP";
  } else {
    serverStatus = "DOWN";
  }

  res.status(200).json({
    status: serverStatus,
    exchangeRateApi: {
      data: healthCache.exchangeRateApi.data,
      responseTime: healthCache.exchangeRateApi.responseTime,
    },
    goldApi: {
      data: healthCache.goldApi.data,
      responseTime: healthCache.goldApi.responseTime,
    },

    message: " Fetch data successfully",
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/api/health`);
  console.log(
    `Server monitoring gold-api is running on http://localhost:${port}/gold-api/health`
  );
  console.log(
    `Server monitoring exchange-rate-api is running on http://localhost:${port}/exchange-rate-api/health`
  );
});
