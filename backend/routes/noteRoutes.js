const express = require("express");
const Note = require("../models/Note");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CREATE NOTE
// ==========================================

router.post("/", protect, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const note = await Note.create({
      user: req.userId,
      title,
      content,
    });

    res.status(201).json(note);

  } catch (error) {
    console.error("Create Note Error:", error);

    res.status(500).json({
      message: "Failed to create note",
      error: error.message,
    });
  }
});


// ==========================================
// GET USER'S NOTES
// ==========================================

router.get("/", protect, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(notes);

  } catch (error) {
    console.error("Get Notes Error:", error);

    res.status(500).json({
      message: "Failed to get notes",
      error: error.message,
    });
  }
});


// ==========================================
// GET ONE NOTE
// ==========================================

router.get("/:id", protect, async (req, res) => {
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

    res.json(note);

  } catch (error) {
    res.status(500).json({
      message: "Failed to get note",
      error: error.message,
    });
  }
});


// ==========================================
// UPDATE NOTE
// ==========================================

router.put("/:id", protect, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      {
        title,
        content,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json(note);

  } catch (error) {
    console.error("Update Note Error:", error);

    res.status(500).json({
      message: "Failed to update note",
      error: error.message,
    });
  }
});


// ==========================================
// DELETE NOTE
// ==========================================

router.delete("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.json({
      message: "Note deleted successfully",
    });

  } catch (error) {
    console.error("Delete Note Error:", error);

    res.status(500).json({
      message: "Failed to delete note",
      error: error.message,
    });
  }
});


module.exports = router;