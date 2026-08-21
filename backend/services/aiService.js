const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function analyzeNote(content) {
  const prompt = `
You are an intelligent note organization assistant.

Analyze the following note.

Return ONLY valid JSON using this exact structure:

{
  "summary": "A concise summary of the note",
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

The category MUST be one of:

Programming
Education
Project
Career
Technology
Personal
Business
Other

Rules:
- Write a short and useful summary.
- Give 3 to 5 key points.
- Give 3 to 5 relevant tags.
- Choose the best category.
- Return JSON only.
- Do not use Markdown.
- Do not add any explanation outside the JSON.

Here is the note:

${content}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  const text = response.text.trim();

  console.log("Gemini response:");
  console.log(text);

  let cleanText = text;

  // Remove Markdown code fences if Gemini adds them
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/, "");
    cleanText = cleanText.replace(/\s*```$/, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/, "");
    cleanText = cleanText.replace(/\s*```$/, "");
  }

  const result = JSON.parse(cleanText);

  return result;
}

module.exports = {
  analyzeNote,
};