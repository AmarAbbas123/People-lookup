require("dotenv").config({ quiet: true });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const peopleRoutes = require("./routes/people");
const chatRoutes = require("./routes/chat");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // bump limit a bit for embeddings

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  autoIndex: true,
  serverSelectionTimeoutMS: 30000, // ensures indexes are created (useful for name + embedding)
})
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Routes

// Health check route (useful for monitoring)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
