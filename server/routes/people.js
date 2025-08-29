const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const Person = require("../models/Person");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function detectSeparator(filePath) {
  try {
    const sample = fs.readFileSync(filePath, { encoding: "utf8" }).slice(0, 2000);
    const comma = (sample.match(/,/g) || []).length;
    const semicolon = (sample.match(/;/g) || []).length;
    const tab = (sample.match(/\t/g) || []).length;
    if (semicolon > comma && semicolon > tab) return ";";
    if (tab > comma && tab > semicolon) return "\t";
    return ",";
  } catch (err) {
    return ",";
  }
}

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

// Upload CSV with upsert (add missing)
router.post("/upload", upload.single("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "CSV file is required" });

  const filePath = req.file.path;
  const separator = detectSeparator(filePath);
  const batchSize = 500;
  let batch = [];
  let totalUpserted = 0;
  let parsedRows = 0;

  const readStream = fs.createReadStream(filePath);
  const parser = csv({ separator });

  try {
    await new Promise((resolve, reject) => {
      parser.on("data", (row) => {
        parsedRows++;
        const mapped = mapRow(row);
        if (!mapped.name) return;
        batch.push(mapped);

        if (batch.length >= batchSize) {
          parser.pause();
          const ops = batch.map((p) => ({
            updateOne: {
              filter: { name: p.name },
              update: { $set: p },
              upsert: true,
            },
          }));
          Person.bulkWrite(ops, { ordered: false })
            .then((r) => {
              totalUpserted += r.upsertedCount + r.modifiedCount;
              batch = [];
              parser.resume();
            })
            .catch((err) => {
              console.error("Bulk insert error:", err);
              batch = [];
              parser.resume();
            });
        }
      });

      parser.on("end", async () => {
        if (batch.length > 0) {
          const ops = batch.map((p) => ({
            updateOne: { filter: { name: p.name }, update: { $set: p }, upsert: true },
          }));
          try {
            const r = await Person.bulkWrite(ops, { ordered: false });
            totalUpserted += r.upsertedCount + r.modifiedCount;
          } catch (err) {
            console.error("Final batch error:", err);
          }
        }
        resolve();
      });

      parser.on("error", reject);
      readStream.on("error", reject);
      readStream.pipe(parser);
    });

    res.json({ message: "CSV processed", parsedRows, totalUpserted });
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(filePath, () => {});
  }
});

router.get("/people", async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: "Query param 'name' is required" });

    const people = await Person.find({ name: { $regex: new RegExp(name, "i") } }).limit(50).lean();
    res.json(people);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
