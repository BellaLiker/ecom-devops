const express = require("express");
const db = require("./db");
const client = require("prom-client");

const app = express();

// Create a registry
const register = new client.Registry();

// Collect default Node.js metrics
client.collectDefaultMetrics({ register });

// Custom Counter
const httpRequests = new client.Counter({
  name: "ecom_http_requests_total",
  help: "Total HTTP requests",
  registers: [register],
});
const requestDuration = new client.Histogram({
  name: "ecom_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});
const dbQueryDuration = new client.Histogram({
  name: "ecom_mysql_query_duration_seconds",
  help: "Time spent executing MySQL queries",
  labelNames: ["query"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});
// Count every request

app.use((req, res, next) => {
  httpRequests.inc();

  const end = requestDuration.startTimer();

  res.on("finish", () => {
    end({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });
  });

  next();
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

// Products API
app.get("/products", (req, res) => {

  const end = dbQueryDuration.startTimer();

  db.query("SELECT * FROM products", (err, results) => {

    end({
      query: "select_products",
    });

    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });

});

// Metrics
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
