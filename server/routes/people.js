const express = require("express");
const { HfInference } = require("@huggingface/inference");
const People = require("../models/people"); // your MongoDB schema

const router = express.Router();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Function to get embeddings
async function getEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2", // free embedding model
      inputs: text,
    });
    return response; // returns an array of numbers
  } catch (err) {
    console.error("Embedding error:", err);
    return null;
  }
}

// Upload CSV → Convert to embeddings → Save to DB
router.post("/upload", async (req, res) => {
  try {
    const { data } = req.body; // assume CSV parsed to JSON
    for (const row of data) {
      const text = `${row.name} ${row.description} ${row.category}`;
      const embedding = await getEmbedding(text);

      const person = new People({
        ...row,
        embedding,
      });
      await person.save();
    }

    res.json({ success: true, message: "CSV uploaded & embeddings saved!" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload CSV" });
  }
});

// Chat route
router.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;

    // Convert query to embedding
    const queryEmbedding = await getEmbedding(query);

    // Find closest match in DB (cosine similarity)
    const people = await People.find();
    let bestMatch = null;
    let bestScore = -1;

    people.forEach((person) => {
      const score =
        cosineSimilarity(queryEmbedding, person.embedding || []);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = person;
      }
    });

    res.json({
      answer: bestMatch
        ? `Best match: ${bestMatch.name} (${bestMatch.category})`
        : "No match found.",
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// Cosine similarity function
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

module.exports = router;
