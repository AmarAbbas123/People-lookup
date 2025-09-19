const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // 👈 use axios for Hugging Face API
const Person = require("../models/Person");

const router = express.Router();

// Multer upload config
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// 🔹 Hugging Face API call for embeddings
async function embedBatch(docs) {
  if (!docs.length) return [];

  const model = process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
  const input = docs.map(docToEmbedText);

  try {
    const resp = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`,
      { inputs: input },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    // API returns an array of vectors for each input
    return resp.data.map((vec) => Array.isArray(vec[0]) ? vec[0] : vec);
  } catch (err) {
    console.error("Hugging Face embedding error:", err.response?.data || err.message);
    return docs.map(() => []); // return empty embeddings on failure
  }
}

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

function docToEmbedText(p) {
  return [
    `Name: ${p.name}`,
    p.description ? `Description: ${p.description}` : "",
    p.category ? `Category: ${p.category}` : "",
    p.blockchain ? `Blockchain: ${p.blockchain}` : "",
    p.device ? `Device: ${p.device}` : "",
    p.status ? `Status: ${p.status}` : "",
    p.nft ? `NFT: ${p.nft}` : "",
    p.f2p ? `F2P: ${p.f2p}` : "",
    p.p2e ? `P2E: ${p.p2e}` : "",
    (p.p2e_score ?? "") !== "" ? `P2E Score: ${p.p2e_score}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Upload CSV and create embeddings in batches
router.post("/upload", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });

  const filePath = req.file.path;
  const separator = detectSeparator(filePath);
  const batchSize = 100; // embedding batch
  const upsertBatchSize = 500; // db bulkWrite batch

  let parsedRows = 0;
  let totalUpserted = 0;
  let pending = [];

  const upsertDocs = async (docs) => {
    if (!docs.length) return;
    const ops = docs.map((p) => ({
      updateOne: {
        filter: { name: p.name },
        update: { $set: p },
        upsert: true,
      },
    }));
    const r = await Person.bulkWrite(ops, { ordered: false });
    totalUpserted += (r.upsertedCount || 0) + (r.modifiedCount || 0);
  };

  try {
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const parser = csv({ separator });

      parser.on("data", (row) => {
        parsedRows++;
        const mapped = mapRow(row);
        if (!mapped.name) return;
        pending.push(mapped);

        if (pending.length >= batchSize) {
          parser.pause();
          (async () => {
            try {
              const vectors = await embedBatch(pending);
              const enriched = pending.map((p, i) => ({ ...p, embedding: vectors[i] || [] }));
              await upsertDocs(enriched);
              pending = [];
              parser.resume();
            } catch (e) {
              console.error("Embedding/upsert batch error:", e.message);
              parser.resume();
            }
          })();
        }
      });

      parser.on("end", async () => {
        try {
          if (pending.length) {
            const vectors = await embedBatch(pending);
            const enriched = pending.map((p, i) => ({ ...p, embedding: vectors[i] || [] }));
            await upsertDocs(enriched);
            pending = [];
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      parser.on("error", reject);
      readStream.on("error", reject);
      readStream.pipe(parser);
    });

    const dbCount = await Person.countDocuments();
    res.json({
      message: "CSV processed with Hugging Face embeddings",
      parsedRows,
      totalUpserted,
      dbCount,
    });
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(filePath, () => {});
  }
});

// Simple search endpoint
router.get("/people", async (req, res, next) => {
  try {
    const { name, limit } = req.query;
    if (!name) return res.status(400).json({ message: "Query param 'name' is required" });
    const queryLimit = Math.min(Number(limit) || 100, 1000);
    const people = await Person.find({ name: { $regex: new RegExp(name, "i") } })
      .limit(queryLimit)
      .lean();
    res.json(people);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
