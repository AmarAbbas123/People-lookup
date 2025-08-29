// server/models/Person.js
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
  name: { type: String, index: true, required: true },
  description: String,
  category: String,
  blockchain: String,
  device: String,
  status: String,
  nft: String,
  f2p: String,
  p2e: String,
  p2e_score: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Person", personSchema);
