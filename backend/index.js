const express = require("express");
const db = require("./db");
const client = require("prom-client");

const app = express();

// Collect default Node.js metrics
client.collectDefaultMetrics();

// Create a Registry
const register = new client.Registry();
register.setDefaultLabels({
  app: "ecom-backend",
});

client.collectDefaultMetrics({ register });

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

// Products API
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

// Prometheus Metrics
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
