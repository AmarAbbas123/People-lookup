// utils/embedder.js
const { pipeline } = require('@xenova/transformers');

// Load embedding model once
let embedder;
async function loadModel() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function getEmbedding(text) {
  const extractor = await loadModel();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data); // convert tensor to plain array
}

module.exports = { getEmbedding };
