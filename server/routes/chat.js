// server/routes/chat.js
const express = require("express");
const axios = require("axios");
const Person = require("../models/Person");
const { embedText } = require("../utils/embedder");
const { topKBySimilarity } = require("../utils/similarity");

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

// Build a readable block from a person doc
function personBlock(p) {
  return [
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
  ].filter(Boolean).join("\n");
}

async function askOllama(prompt) {
  if (!OLLAMA_URL) throw new Error("OLLAMA_URL not set");
  const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0.2 },
  }, { timeout: 60000 });
  return res.data?.response || "";
}

router.post("/chat", async (req, res) => {
  try {
    const question = (req.body.question || "").trim();
    if (!question) return res.json({ answer: "Ask something (e.g., 'Tell me about Axie Infinity')." });

    // 1) embed question
    const qvec = await embedText(question);

    // 2) get candidates with embeddings from DB
    const candidates = await Person.find({ embedding: { $exists: true, $ne: [] } }, { name: 1, description: 1, category:1, blockchain:1, device:1, status:1, nft:1, f2p:1, p2e:1, p2e_score:1, embedding:1 }).lean();

    if (!candidates.length) {
      return res.json({ answer: "No embedded data found. Upload CSV first." });
    }

    // 3) pick top-K by similarity
    const K = 6;
    const top = topKBySimilarity(qvec, candidates, K);
    const topDocs = top.map(t => {
      // find doc by id (we kept embedding in items so t contains doc fields too)
      const doc = candidates.find(c => String(c._id) === String(t._id));
      return { ...doc, _score: t.score };
    }).filter(Boolean);

    // 4) create context
    const context = topDocs.map((d,i) => `#${i+1}\n${personBlock(d)}\nScore:${d._score.toFixed(4)}`).join("\n\n---\n\n");

    // 5) ask Ollama if available, otherwise fallback to structured summary
    const system = `
You are an assistant that must answer ONLY from CONTEXT. If the answer cannot be found in context, say "I don't have that information."
Be concise and show key fields when relevant.
`;
    const prompt = `${system}\nCONTEXT:\n${context}\n\nQUESTION:\n${question}\n\nAnswer:`;

    let answer = "";
    try {
      if (OLLAMA_URL) {
        answer = await askOllama(prompt);
      } else {
        // fallback: build a concise summary string
        answer = `Top ${topDocs.length} matches:\n\n` + topDocs.map((d,i) => {
          return `${i+1}. ${d.name} — ${d.category || "—"} — P2E: ${d.p2e_score ?? "—"}\n${d.description ? d.description : ""}`;
        }).join("\n\n");
      }
    } catch (err) {
      console.warn("LLM call failed, using fallback summary:", err.message);
      answer = `Top ${topDocs.length} matches (LLM unavailable):\n\n` + topDocs.map((d,i) => `${i+1}. ${d.name} — ${d.category || "—"} — P2E: ${d.p2e_score ?? "—"}`).join("\n");
    }

    return res.json({ answer, results: topDocs });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ answer: "⚠️ Error while processing. See server logs." });
  }
});

module.exports = router;
