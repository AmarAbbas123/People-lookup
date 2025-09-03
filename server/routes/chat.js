const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const Person = require("../models/Person");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GEN_MODEL = process.env.GEN_MODEL || "gpt-4o-mini";
const EMB_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const VECTOR_BACKEND = (process.env.VECTOR_BACKEND || "local").toLowerCase();
const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME || "people_embedding_index";

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
    (p.p2e_score !== undefined && p.p2e_score !== null) ? `P2E Score: ${p.p2e_score}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embedText(text) {
  const r = await openai.embeddings.create({
    model: EMB_MODEL,
    input: text,
  });
  return r.data[0].embedding;
}

router.post("/chat", async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) {
    return res.json({ answer: "Please ask a question (e.g., 'Tell me about CryptoGame')." });
  }

  try {
    // 1) Embed the question
    const qvec = await embedText(question);

    // 2) Retrieve top-k from your DB
    let topDocs = [];

    if (VECTOR_BACKEND === "atlas") {
      // MongoDB Atlas Vector Search (requires index creation; see step 3b below)
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
            _score: { $meta: "vectorSearchScore" }
          }
        }
      ];
      topDocs = await Person.aggregate(pipeline);
    } else {
      // Local: pull embeddings and compute cosine similarity in Node
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

    // 3) Build context + ask the model
    const context = topDocs.map((p, i) => `#${i + 1}\n${formatPerson(p)}`).join("\n\n---\n\n");
    const system = [
      "You are a helpful assistant that answers ONLY using the provided context.",
      "If the answer is not in the context, say you don't have that information.",
      "Be concise and include names and key fields when possible."
    ].join(" ");

    const completion = await openai.chat.completions.create({
      model: GEN_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Question: ${question}\n\nContext:\n${context}` },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim()
      || "Sorry, I couldn't find information in your dataset.";

    // return with results so your UI can render cards
    return res.json({ answer, results: topDocs });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ answer: "⚠️ Error while answering. Try again." });
  }
});

module.exports = router;
