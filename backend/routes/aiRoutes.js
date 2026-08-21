const express = require("express");
const mongoose = require("mongoose");
const Note = require("../models/Note");
const { analyzeNote } = require("../services/aiService");
const { createEmbedding } = require("../services/embeddingService");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// ANALYZE ONE NOTE WITH AI
// ==========================================

router.post("/summarize/:id", protect, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    const aiResult = await analyzeNote(
      note.title,
      note.content
    );

    const textForEmbedding = `
Title: ${note.title}

Content: ${note.content}

Summary: ${aiResult.summary}

Tags: ${(aiResult.tags || []).join(", ")}

Category: ${aiResult.category || "Other"}
`;

    const embedding = await createEmbedding(textForEmbedding);

    note.summary = aiResult.summary || "";
    note.keyPoints = aiResult.keyPoints || [];
    note.tags = aiResult.tags || [];
    note.category = aiResult.category || "Other";
    note.embedding = embedding;

    await note.save();

    res.json({
      message: "AI analysis completed",
      note,
    });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      message: "AI analysis failed",
      error: error.message,
    });
  }
});


// ==========================================
// CREATE EMBEDDINGS FOR ALL USER NOTES
// ==========================================

router.post("/embed-all", protect, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.userId,
    });

    let processed = 0;

    for (const note of notes) {
      const textForEmbedding = `
Title: ${note.title}

Content: ${note.content}

Summary: ${note.summary || ""}

Tags: ${(note.tags || []).join(", ")}

Category: ${note.category || "Other"}
`;

      const embedding = await createEmbedding(textForEmbedding);

      note.embedding = embedding;

      await note.save();

      processed++;
    }

    res.json({
      message: "Embeddings created successfully",
      processed,
    });

  } catch (error) {
    console.error("Embedding Error:", error);

    res.status(500).json({
      message: "Failed to create embeddings",
      error: error.message,
    });
  }
});


// ==========================================
// ASK MY NOTES - SEMANTIC SEARCH + AI
// ==========================================

router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        message: "Question is required",
      });
    }


    // --------------------------------------
    // CREATE QUESTION EMBEDDING
    // --------------------------------------

    const questionEmbedding = await createEmbedding(
      question
    );


    // --------------------------------------
    // SEARCH ONLY USER'S NOTES
    // --------------------------------------

    const relevantNotes = await Note.aggregate([
      {
        $vectorSearch: {
          index: "note_vector_index",
          path: "embedding",
          queryVector: questionEmbedding,
          numCandidates: 50,
          limit: 5,

          filter: {
            user: new mongoose.Types.ObjectId(
              req.userId
            ),
          },
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          summary: 1,
          keyPoints: 1,
          tags: 1,
          category: 1,

          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ]);


    // --------------------------------------
    // NO NOTES FOUND
    // --------------------------------------

    if (relevantNotes.length === 0) {
      return res.json({
        answer:
          "I couldn't find relevant information in your notes.",
        sources: [],
      });
    }


    // --------------------------------------
    // BUILD NOTES CONTEXT
    // --------------------------------------

    const notesContext = relevantNotes
      .map((note, index) => {
        return `
NOTE ${index + 1}

Title:
${note.title}

Category:
${note.category || "Other"}

Tags:
${(note.tags || []).join(", ")}

Summary:
${note.summary || ""}

Key Points:
${(note.keyPoints || []).join("\n")}

Content:
${note.content}
`;
      })
      .join("\n--------------------\n");


    // --------------------------------------
    // GEMINI PROMPT
    // --------------------------------------

    const prompt = `
You are an AI assistant for a personal notes application.

Answer the user's question using ONLY the information
contained in the provided notes.

Do not invent information.

If the answer cannot be found in the notes, say:

"I couldn't find that information in your notes."

Give a clear and concise answer.

USER QUESTION:

${question}

RELEVANT NOTES:

${notesContext}
`;


    // --------------------------------------
    // GENERATE AI ANSWER
    // --------------------------------------

    const { GoogleGenAI } = require("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const answer = response.text.trim();


    // --------------------------------------
    // RETURN ANSWER + SOURCES
    // --------------------------------------

    res.json({
      answer,

      sources: relevantNotes.map((note) => ({
        id: note._id,
        title: note.title,
        score: note.score,
      })),
    });

  } catch (error) {
    console.error("Ask Notes Error:", error);

    res.status(500).json({
      message: "Failed to answer question",
      error: error.message,
    });
  }
});


module.exports = router;



   