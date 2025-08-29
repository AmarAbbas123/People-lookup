// server/routes/chat.js
const express = require("express");
const router = express.Router();
const Person = require("../models/Person");

// Helper to safely build regex from user input
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Format a single person into a readable string
function formatPerson(p) {
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

router.post("/chat", async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) return res.json({ answer: "Please ask a question (e.g. 'Tell me about John Doe')." });

  try {
    // 1) Exact name extraction patterns: quoted name or patterns like "about NAME", "who is NAME"
    let nameMatch = question.match(/"(.*?)"/) || question.match(/'(.*?)'/);
    if (!nameMatch) {
      nameMatch = question.match(/(?:about|tell me about|who is|who's|info on|information on|details of)\s+([A-Za-z0-9 \-_'".]+)/i);
    }
    if (!nameMatch) {
      nameMatch = question.match(/^(?:who is|who's|tell me about)\s+([A-Za-z0-9 \-_'".]+)$/i);
    }

    if (nameMatch && nameMatch[1]) {
      const rawName = nameMatch[1].trim();
      const nameRegex = new RegExp(escapeRegExp(rawName), "i");
      const person = await Person.findOne({ name: nameRegex }).lean();

      if (person) {
        const answer = `I found one result:\n\n${formatPerson(person)}`;
        return res.json({ answer, results: [person] });
      } else {
        // fallback: partial search
        const list = await Person.find({ name: { $regex: nameRegex } }).limit(10).lean();
        if (list.length) {
          const answer = `I found ${list.length} matches for "${rawName}". Here are the top results:\n` +
            list.map((p, i) => `${i + 1}. ${p.name} — ${p.category || "—"} — P2E score: ${p.p2e_score || 0}`).join("\n");
          return res.json({ answer, results: list });
        }
        return res.json({ answer: `I couldn't find anyone named "${rawName}".` });
      }
    }

    // 2) Top N by p2e_score: "top 5 by p2e score"
    const topMatch = question.match(/top\s+(\d+)\s+(?:by\s+)?p2e(?:\s*[-_]?\s*score)?/i);
    if (topMatch) {
      const n = Math.min(parseInt(topMatch[1], 10) || 5, 50);
      const results = await Person.find().sort({ p2e_score: -1 }).limit(n).lean();
      const answer = `Top ${n} by P2E score:\n` + results.map((p, i) => `${i + 1}. ${p.name} — ${p.p2e_score || 0} — ${p.category || "—"}`).join("\n");
      return res.json({ answer, results });
    }

    // 3) List/filter pattern: "list people in gaming" or "show people in ethereum"
    const listMatch = question.match(/(?:list|show|find|who are)\s+(?:people|items|results)?\s*(?:in|with|on|that have)?\s+(.+)/i);
    if (listMatch && listMatch[1]) {
      const term = listMatch[1].trim().replace(/\?$/, "");
      const termRegex = new RegExp(escapeRegExp(term), "i");

      const results = await Person.find({
        $or: [
          { category: termRegex },
          { blockchain: termRegex },
          { device: termRegex },
          { status: termRegex },
          { nft: termRegex },
          { f2p: termRegex },
          { p2e: termRegex },
          { description: termRegex },
          { name: termRegex },
        ],
      })
        .limit(50)
        .lean();

      if (results.length === 0) {
        return res.json({ answer: `No results found for "${term}".` });
      }

      const short = results.slice(0, 10).map((p, i) => `${i + 1}. ${p.name} — ${p.category || "—"} — ${p.blockchain || "—"}`).join("\n");
      const answer = `Found ${results.length} results for "${term}". Top results:\n${short}`;
      return res.json({ answer, results });
    }

    // 4) Generic search across fields (fallback)
    const qRegex = new RegExp(escapeRegExp(question), "i");
    let results = await Person.find({
      $or: [
        { name: qRegex },
        { description: qRegex },
        { category: qRegex },
        { blockchain: qRegex },
        { device: qRegex },
        { status: qRegex },
        { nft: qRegex },
        { f2p: qRegex },
        { p2e: qRegex },
      ],
    })
      .limit(50)
      .lean();

    if (results.length === 0) {
      return res.json({ answer: "I couldn't find anything matching your query. Try 'Tell me about NAME' or 'List people in CATEGORY'." });
    }

    if (results.length === 1) {
      const answer = `I found one match:\n\n${formatPerson(results[0])}`;
      return res.json({ answer, results });
    }

    // multiple matches
    const summary = results.slice(0, 10).map((p, i) => `${i + 1}. ${p.name} — ${p.category || "—"} — P2E ${p.p2e_score || 0}`).join("\n");
    const answer = `I found ${results.length} matches. Top results:\n${summary}`;
    return res.json({ answer, results });

  } catch (err) {
    console.error("Chat error:", err);
    return res.json({ answer: "⚠️ Error while searching. Try again." });
  }
});

module.exports = router;
