const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const Person = require("../models/Person");

const router = express.Router();

// Save uploaded file to disk (tmp)
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 200 * 1024 * 1024 }, // 50MB
});

// Helper: map CSV row to schema
function mapRow(row) {
  const norm = {};
  for (const [k, v] of Object.entries(row)) {
    if (!k) continue;
    const key = String(k).trim();
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

// POST /api/upload – upload CSV
router.post("/upload", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });

  const filePath = req.file.path;
  const data = [];

  try {
    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => data.push(mapRow(row)))
        .on("end", resolve)
        .on("error", reject);
    });

    // Batch insert (500 rows per batch)
    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      try {
        const inserted = await Person.insertMany(batch, { ordered: false });
        totalInserted += inserted.length;
      } catch (err) {
        console.error("Some rows failed to insert in this batch:", err);
      }
    }

    res.json({
      message: "CSV processed",
      totalRows: data.length,
      inserted: totalInserted,
    });
  } catch (err) {
    next(err);
  } finally {
    // Delete the uploaded file
    fs.unlink(filePath, () => {});
  }
});

// GET /api/people?name=SomeName – search by partial name
router.get("/people", async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: "Query param 'name' is required" });

    const people = await Person.find({
      name: { $regex: new RegExp(name, "i") },
    })
      .limit(50)
      .lean();

    res.json(people);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
