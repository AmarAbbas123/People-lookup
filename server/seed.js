// seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Person from "./models/Person.js";
import { getEmbedding } from "./utils/embedder.js";

dotenv.config();

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Example dataset
    const people = [
      {
        name: "CryptoGame",
        description: "A blockchain-based play-to-earn game with NFT rewards.",
        category: "Gaming",
        blockchain: "Ethereum",
        device: "Mobile",
        status: "Active",
      },
      {
        name: "ArtNFT",
        description: "An NFT marketplace for digital artists and collectors.",
        category: "Marketplace",
        blockchain: "Polygon",
        device: "Web",
        status: "Beta",
      },
      {
        name: "MetaWorld",
        description: "A virtual reality metaverse with play-to-earn mechanics.",
        category: "Metaverse",
        blockchain: "Solana",
        device: "VR/PC",
        status: "Alpha",
      },
    ];

    // Clear old data
    await Person.deleteMany({});
    console.log("🗑️ Old data cleared");

    // Insert new people with embeddings
    for (let p of people) {
      const textForEmbedding = [p.name, p.description, p.category]
        .filter(Boolean)
        .join(" ");
      const embedding = await getEmbedding(textForEmbedding);

      await Person.create({ ...p, embedding });
      console.log(`✅ Inserted ${p.name}`);
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
}

seed();
