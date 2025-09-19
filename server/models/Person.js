const mongoose = require("mongoose");

const PersonSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    description: String,
    category: String,
    blockchain: String,
    device: String,
    status: String,
    nft: String,
    f2p: String,
    p2e: String,
    p2e_score: { type: Number, default: 0 },

    // Vector embedding (from Hugging Face instead of OpenAI)
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Person", PersonSchema);
