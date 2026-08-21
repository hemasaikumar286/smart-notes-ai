const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    summary: {
      type: String,
      default: "",
    },

    keyPoints: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      default: "Other",
    },

    embedding: {
      type: [Number],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);

