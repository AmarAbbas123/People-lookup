// routes/chat.js
const express = require("express");
const router = express.Router();
const Person = require("../models/Person");

// Hugging Face API key (set in .env)
const HF_API_KEY = process.env.HF_API_KEY;

// Models (you can change to better ones if needed)
const GEN_MODEL = process.env.HF_GEN_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
const EMB_MODEL = process.env.HF_EMBED_MODEL || "sentence-transformers/all-MiniLM-L6-v2";

const VECTOR_BACKEND = (process.env.VECTOR_BACKEND || "local").toLowerCase();
const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME || "people_embedding_index";

// ---------------- Helpers ----------------

// Format a Person into readable text
function formatPerson(p) {
  const parts = [
    `Name: ${p.name || "—"}`,
    p.description ? `Description: ${p.description}` : null,
    p.category ? `Category: ${p.category}` : null,
    p.blockchain ? `Blockchain: ${p.blockchain}` : null,
    p.device ? `Device: ${p.device}` : null,
    p.status ? `Status: ${p.status}` : null,
    p.nft ? `NFT: ${p.nft}` : null,
    p.f2p ? `F2P: ${p.f2p}` : null,
    p.p2e ? `P2E: ${p.p2e}` : null,
    (p.p2e_score !== undefined && p.p2e_score !== null)
      ? `P2E Score: ${p.p2e_score}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

// Cosine similarity (for local retrieval)


// Get embedding from Hugging Face
async function embedText(text) {
  const response = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${EMB_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!response.ok) {
    throw new Error(`HF Embedding API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data[0]; // embedding vector
}

// Generate answer from Hugging Face
async function generateAnswer(question, context) {
  const system = [
    "You are a helpful assistant that ONLY uses the provided context.",
    "If the answer is not in the context, say you don't have that information.",
    "Be concise and include names and key fields when possible."
  ].join(" ");

  const prompt = `${system}\n\nQuestion: ${question}\n\nContext:\n${context}`;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${GEN_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 300, temperature: 0.2 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HF Generation API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data[0]?.generated_text || "").trim();
}

// ---------------- Routes ----------------

// Chat endpoint
router.post("/chat", async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) {
    return res.json({
      answer: "Please ask a question (e.g., 'Tell me about CryptoGame').",
    });
  }

  try {
    // 1) Embed the question
    const qvec = await embedText(question);

    // 2) Retrieve top-k from DB
    let topDocs = [];

    if (VECTOR_BACKEND === "atlas") {
      // MongoDB Atlas Vector Search
      const pipeline = [
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector: qvec,
            numCandidates: 200,
            limit: 5,
          },
        },
        {
          $project: {
            name: 1, description: 1, category: 1, blockchain: 1, device: 1,
            status: 1, nft: 1, f2p: 1, p2e: 1, p2e_score: 1,
            _score: { $meta: "vectorSearchScore" },
          },
        },
      ];
      topDocs = await Person.aggregate(pipeline);
    } else {
      // Local cosine similarity
      const candidates = await Person.find({ embedding: { $exists: true, $ne: [] } })
        .limit(5000)
        .lean();
      const scored = candidates.map((d) => ({
        ...d,
        _score: cosineSim(qvec, d.embedding || []),
      }));
      scored.sort((a, b) => b._score - a._score);
      topDocs = scored.slice(0, 5);
    }

    if (!topDocs.length) {
      return res.json({
        answer: "I couldn't find anything related in your dataset.",
        results: [],
      });
    }

    // 3) Build context
    const context = topDocs
      .map((p, i) => `#${i + 1}\n${formatPerson(p)}`)
      .join("\n\n---\n\n");

    // 4) Generate answer
    const answer = await generateAnswer(question, context);

    return res.json({ answer, results: topDocs });
  } catch (err) {
    console.error("Chat error:", err);
    return res
      .status(500)
      .json({ answer: "⚠️ Error while answering. Try again." });
  }
});

module.exports = router;
