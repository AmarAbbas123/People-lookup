require('dotenv').config({ quiet: true });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const peopleRoutes = require("./routes/people");
const chatRoutes = require("./routes/chat");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected! sucessfully"))
  .catch((err) => {
    console.error(" MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use("/api", peopleRoutes);
app.use("/api", chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
