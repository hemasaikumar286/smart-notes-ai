require("dotenv").config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// You can change this in Render Environment Variables.
// "openrouter/free" automatically selects an available free model.
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

async function analyzeNote(titleOrContent, maybeContent) {
  try {
    // Supports both:
    // analyzeNote(content)
    // analyzeNote(title, content)

    let title;
    let content;

    if (maybeContent === undefined) {
      title = "Untitled Note";
      content = titleOrContent;
    } else {
      title = titleOrContent;
      content = maybeContent;
    }

    if (!content || !String(content).trim()) {
      throw new Error("Note content is empty");
    }

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is missing");
    }

    const prompt = `
You are an intelligent note organization assistant.

Analyze the following note.

NOTE TITLE:
${title}

NOTE CONTENT:
${content}

Return ONLY valid JSON.

Use exactly this structure:

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

Rules:

1. summary:
- Give a clear and concise summary.
- Use 1 to 3 sentences.

2. keyPoints:
- Give 3 to 6 important points.
- Each point should be a complete sentence.

3. tags:
- Give 3 to 8 useful tags.
- Do not use # symbols.

4. category:
Choose ONE category from:

Programming
Database
Artificial Intelligence
Machine Learning
Web Development
Education
Business
Career
Technology
Personal
Project
Other

5. Return ONLY JSON.
Do not use markdown.
Do not use code fences.
Do not add explanations outside the JSON.
`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",

      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",

        // These are recommended by OpenRouter.
        "HTTP-Referer": "https://smart-notes-app.vercel.app",
        "X-Title": "Smart Notes AI"
      },

      body: JSON.stringify({
        model: MODEL,

        messages: [
          {
            role: "system",
            content:
              "You organize notes intelligently. Always return valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],

        temperature: 0.2,

        // Ask the model for JSON when supported.
        response_format: {
          type: "json_object"
        }
      })
    });

    const data = await response.json();

    // OpenRouter returned an API error.
    if (!response.ok) {
      console.error(
        "OpenRouter API Error:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        data?.error?.message ||
        `OpenRouter request failed with status ${response.status}`
      );
    }

    const aiText = data?.choices?.[0]?.message?.content;

    if (!aiText) {
      console.error(
        "OpenRouter returned no content:",
        JSON.stringify(data, null, 2)
      );

      throw new Error("OpenRouter returned an empty response");
    }

    console.log("OpenRouter model:", MODEL);

    console.log("AI response received successfully");

    // Clean possible markdown fences just in case.
    let cleanedText = aiText.trim();

    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }

    let result;

    try {
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("AI JSON Parse Error:", parseError.message);
      console.error("AI Raw Response:", aiText);

      throw new Error("AI returned invalid JSON");
    }

    // Make sure the returned object has the fields our app needs.
    return {
      summary:
        typeof result.summary === "string"
          ? result.summary
          : "",

      keyPoints:
        Array.isArray(result.keyPoints)
          ? result.keyPoints
          : [],

      tags:
        Array.isArray(result.tags)
          ? result.tags
          : [],

      category:
        typeof result.category === "string"
          ? result.category
          : "Other"
    };

  } catch (error) {
    console.error("AI analysis failed:", error.message);

    // Re-throw so aiRoutes.js can handle it.
    throw error;
  }
}

module.exports = {
  analyzeNote
};