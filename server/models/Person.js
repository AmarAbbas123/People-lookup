import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema({
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
  embedding: [Number],
});

export default mongoose.model("Person", PersonSchema);
