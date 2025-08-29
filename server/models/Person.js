const mongoose = require("mongoose");

const personSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    description : String,
    category : String,
    blockchain : String,
    device : String,
    status  :String,
    nft : String,
    f2p : String,
    p2e : String,
    p2e_score: { type: Number, default: 0 },
    // Keep an open field for anything extra the CSV may contain
    // (optional, remove if you want strict schema only)
    extra: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Helpful index for case-insensitive name searches
personSchema.index({ name: 1 });

module.exports = mongoose.model("Person", personSchema);
