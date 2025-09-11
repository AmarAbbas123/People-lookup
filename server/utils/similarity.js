// server/utils/similarity.js
// Vectors are normalized by the embedder (L2 normalized) — so cosine == dot.
function dot(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += (a[i] || 0) * (b[i] || 0);
  return s;
}

/** items: [{ _id, embedding }] -> returns top-k items with score */
function topKBySimilarity(queryVec, items, k = 5) {
  const scored = items
    .map((it) => ({
      ...it,
      score: dot(queryVec, it.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  return scored;
}

module.exports = { dot, topKBySimilarity };
