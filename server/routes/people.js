const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const Person = require("../models/Person");

const router = express.Router();

// Multer upload config
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Detect CSV separator
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

// Normalize row keys
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

// Upload CSV
router.post("/upload", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });

  const filePath = req.file.path;
  const separator = detectSeparator(filePath);
  const batchSize = 1000;

  let parsedRows = 0;
  let totalUpserted = 0;
  let batch = [];
  let bulkOps = []; // promises for all bulkWrites

  try {
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const parser = csv({ separator });

      parser.on("data", (row) => {
        parsedRows++;
        const mapped = mapRow(row);
        if (!mapped.name) return;

        batch.push(mapped);

        if (batch.length >= batchSize) {
          const currentBatch = batch;
          batch = [];

          // push promise to bulkOps array
          bulkOps.push(
            Person.bulkWrite(
              currentBatch.map((p) => ({
                updateOne: {
                  filter: { name: p.name },
                  update: { $set: p },
                  upsert: true,
                },
              })),
              { ordered: false }
            )
              .then((r) => {
                totalUpserted += (r.upsertedCount || 0) + (r.modifiedCount || 0);
              })
              .catch((err) => {
                console.error("Bulk insert error:", err.message);
              })
          );
        }
      });

      parser.on("end", async () => {
        if (batch.length > 0) {
          bulkOps.push(
            Person.bulkWrite(
              batch.map((p) => ({
                updateOne: {
                  filter: { name: p.name },
                  update: { $set: p },
                  upsert: true,
                },
              })),
              { ordered: false }
            )
              .then((r) => {
                totalUpserted += (r.upsertedCount || 0) + (r.modifiedCount || 0);
              })
              .catch((err) => {
                console.error("Final batch error:", err.message);
              })
          );
        }
        resolve();
      });

      parser.on("error", reject);
      readStream.on("error", reject);
      readStream.pipe(parser);
    });

    // Wait for all bulk operations
    await Promise.all(bulkOps);

    const dbCount = await Person.countDocuments();
    res.json({
      message: "CSV processed",
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

// Search people
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
