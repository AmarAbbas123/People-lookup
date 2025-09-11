// server/routes/people.js
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const Person = require("../models/Person");
const { embedText, personToSnippet } = require("../utils/embedder");

const router = express.Router();
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 100 * 1024 * 1024 },
});

function detectSeparator(filePath) {
  try {
    const sample = fs.readFileSync(filePath, "utf8").slice(0, 2000);
    const comma = (sample.match(/,/g) || []).length;
    const semicolon = (sample.match(/;/g) || []).length;
    const tab = (sample.match(/\t/g) || []).length;
    if (semicolon > comma && semicolon > tab) return ";";
    if (tab > comma && tab > semicolon) return "\t";
    return ",";
  } catch {
    return ",";
  }
}

function mapRow(row) {
  const norm = {};
  for (const [k, v] of Object.entries(row)) {
    if (!k) continue;
    const key = String(k).trim().toLowerCase();
    norm[key] = typeof v === "string" ? v.trim() : v;
  }
  return {
    name: norm.name || "",
    description: norm.description || "",
    category: norm.category || "",
    blockchain: norm.blockchain || "",
    device: norm.device || "",
    status: norm.status || "",
    nft: norm.nft || "",
    f2p: norm.f2p || "",
    p2e: norm.p2e || "",
    p2e_score: norm.p2e_score ? Number(norm.p2e_score) : 0,
  };
}

router.post("/upload", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });

  const filePath = req.file.path;
  const separator = detectSeparator(filePath);

  try {
    // 1) parse CSV
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator }))
        .on("data", (row) => {
          const mapped = mapRow(row);
          if (mapped.name) rows.push(mapped);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // 2) embed and upsert in chunks
    const chunkSize = 100; // tune for memory & speed
    let totalUpserted = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      // compute embeddings sequentially per doc (we avoid flooding CPU/memory)
      for (const doc of chunk) {
        try {
          const snippet = personToSnippet(doc);
          doc.embedding = await embedText(snippet);
        } catch (e) {
          console.error("Embedding error for", doc.name, e.message);
          doc.embedding = undefined;
        }
      }

      // bulk upsert
      const ops = chunk.map((p) => ({
        updateOne: {
          filter: { name: p.name },
          update: { $set: p },
          upsert: true,
        },
      }));
      const r = await Person.bulkWrite(ops, { ordered: false });
      totalUpserted += (r.upsertedCount || 0) + (r.modifiedCount || 0);
    }

    const dbCount = await Person.countDocuments();
    res.json({ message: "CSV processed with embeddings", parsedRows: rows.length, totalUpserted, dbCount });
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(filePath, () => {});
  }
});

// Keep the quick search by name if you want
router.get("/people", async (req, res, next) => {
  try {
    const { name, limit } = req.query;
    if (!name) return res.status(400).json({ message: "Query param 'name' is required" });
    const queryLimit = Math.min(Number(limit) || 100, 1000);
    const people = await Person.find({ name: { $regex: new RegExp(name, "i") } }).limit(queryLimit).lean();
    res.json(people);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
