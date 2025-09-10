// server/routes/people.js
const { getEmbedding } = require("../utils/embedder");

// inside mapRow() keep as is

// After parsing row
async function enrichWithEmbedding(person) {
  const text = `${person.name} ${person.description} ${person.category} ${person.blockchain} ${person.device} ${person.status}`;
  person.embedding = await getEmbedding(text);
  return person;
}

// in your CSV processing loop, replace:
const mapped = mapRow(row);

// add this line:
await enrichWithEmbedding(mapped);
