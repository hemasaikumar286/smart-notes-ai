const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL = "openai/gpt-4o-mini";

async function analyzeNote(title, content) {
  try {
    const prompt = `
Analyze the following note.

Title:
${title}

Content:
${content}

Return ONLY valid JSON in this exact format:

{
  "summary": "A short summary of the note",
  "keyPoints": [
    "Important point 1",
    "Important point 2",
    "Important point 3"
  ],
  "tags": [
    "tag1",
    "tag2",
    "tag3"
  ],
  "category": "Programming"
}

Rules:
- summary should be concise
- keyPoints should contain 3 to 6 important points
- tags should contain 3 to 8 useful tags
- category should be one of:
  Programming,
  Database,
  Artificial Intelligence,
  Machine Learning,
  Web Development,
  Education,
  Business,
  Personal,
  Other
- Return JSON only.
`;

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that organizes notes. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error("AI returned an empty response");
    }

    // Remove markdown code fences if the model adds them
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result = JSON.parse(cleanedText);

    return {
      summary: result.summary || "",
      keyPoints: Array.isArray(result.keyPoints)
        ? result.keyPoints
        : [],
      tags: Array.isArray(result.tags)
        ? result.tags
        : [],
      category: result.category || "Other",
    };

  } catch (error) {
    console.error(
      "OpenRouter AI Error:",
      error.response?.data || error.message
    );

    throw new Error("AI analysis failed");
  }
}

module.exports = {
  analyzeNote,
};