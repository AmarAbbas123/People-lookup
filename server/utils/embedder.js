// server/utils/embedder.js
// This file uses dynamic import so it works in CommonJS projects.
// Requires Node 18+.

let extractorPromise = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const mod = await import("@xenova/transformers");
      const { pipeline } = mod;
      // Use a compact, good-quality model — Xenova hosts "all-MiniLM-L6-v2"
      // This will download the model the first time you run it.
      const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      return extractor;
    })();
  }
  return extractorPromise;
}

/**
 * embedText(text) -> Promise<Array<number>>
 * returns a normalized embedding array (numbers)
 */
async function embedText(text) {
  const extractor = await getExtractor();
  // pooling mean + normalize true emulates sentence-transformers style
  const out = await extractor(text, { pooling: "mean", normalize: true });
  // out.data is a typed array-like object
  return Array.from(out.data);
}

/** Build a short snippet to embed from a person object */
function personToSnippet(p) {
  return [
    p.name,
    p.description,
    p.category,
    p.blockchain,
    p.device,
    p.status,
    p.nft,
    p.f2p,
    p.p2e,
    typeof p.p2e_score === "number" ? `p2e_score:${p.p2e_score}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

module.exports = { embedText, personToSnippet };
