// utils/embedder.js
const { pipeline } = require('@xenova/transformers');

let embedder;

/**
 * Loads and caches the embedding model.
 */
async function loadModel() {
  if (!embedder) {
    console.log("Loading embedding model: Xenova/all-MiniLM-L6-v2 ...");
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("Embedding model loaded ✅");
  }
  return embedder;
}

/**
 * Generates a normalized embedding vector for a given text.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} - Embedding vector as a plain array.
 */
async function getEmbedding(text) {
  if (!text || !text.trim()) return [];
  const extractor = await loadModel();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data); // convert tensor to plain array
}

module.exports = { getEmbedding };
