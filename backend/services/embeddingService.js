require("dotenv").config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings";

// Set this in .env / Render if you want to change the model.
const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

async function createEmbedding(text) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    if (!text || !String(text).trim()) {
      throw new Error("Text for embedding is empty");
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://smart-notes-app.vercel.app",
        "X-Title": "Smart Notes AI"
      },

      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: String(text)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenRouter Embedding Error:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        data?.error?.message ||
        `Embedding request failed with status ${response.status}`
      );
    }

    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error(
        "Invalid embedding response:",
        JSON.stringify(data, null, 2)
      );

      throw new Error("OpenRouter returned an invalid embedding");
    }

    console.log(
      `Embedding created successfully (${embedding.length} dimensions)`
    );

    return embedding;

  } catch (error) {
    console.error("Embedding Error:", error.message);
    throw error;
  }
}

module.exports = {
  createEmbedding
};