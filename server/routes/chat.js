// server/routes/chat.js
const express = require("express");
const router = express.Router();
const Person = require("../models/Person");
const { getEmbedding } = require("../utils/embedder");
const { cosine } = require("ml-distance");

// Cosine similarity function
function cosineSim(a, b) {
  return 1 - cosine(a, b);
}

router.post("/chat", async (req, res) => {
  try {
    const question = (req.body.question || "").trim();
    if (!question) {
      return res.json({ answer: "Please ask a question." });
    }

    // 1) Embed user question
    const queryEmbedding = await getEmbedding(question);

    // 2) Fetch candidates from DB (you can optimize with vector DB later)
    const people = await Person.find({ embedding: { $exists: true } }).lean();

    // 3) Rank by similarity
    const scored = people.map(p => ({
      ...p,
      score: cosineSim(queryEmbedding, p.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);

    // 4) Return top results
    if (scored.length === 0) {
      return res.json({ answer: "No data found." });
    }

    const top = scored.slice(0, 5);
    const answer =
      `Here are the most relevant results:\n` +
      top.map((p, i) =>
        `${i + 1}. ${p.name} — ${p.category || "—"} — score: ${p.score.toFixed(2)}`
      ).join("\n");

    res.json({ answer, results: top });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ answer: "⚠️ Error while searching." });
  }
});

module.exports = router;
