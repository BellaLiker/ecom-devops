const express = require("express");
const db = require("./db");

const app = express();

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
