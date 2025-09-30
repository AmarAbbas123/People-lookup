import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  blockchain: String,
  device: String,
  status: String,
  nft: String,
  f2p: String,
  p2e: String,
  p2e_score: Number,
  embedding: { type: [Number], default: [] } // ✅ store embeddings
});

export default mongoose.model("Person", personSchema);
