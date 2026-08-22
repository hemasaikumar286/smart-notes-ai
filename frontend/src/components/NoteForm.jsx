import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

function NoteForm({ editingNote, onSaved, onCancel }) {
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load note data when editing
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title || "");
      setContent(editingNote.content || "");
    } else {
      setTitle("");
      setContent("");
    }

    setError("");
  }, [editingNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter some content.");
      return;
    }

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    setLoading(true);

    try {
      const isEditing = Boolean(editingNote);

      const url = isEditing
        ? `${API_URL}/api/notes/${editingNote._id}`
        : `${API_URL}/api/notes`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save note"
        );
      }

      // Clear form
      setTitle("");
      setContent("");

      // Tell parent component the note was saved
      if (onSaved) {
        onSaved(data);
      }

    } catch (error) {
      console.error("Save note error:", error);

      setError(
        error.message || "Something went wrong while saving the note."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setError("");

    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {editingNote ? "Edit Note" : "Create Note"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editingNote
              ? "Update your note"
              : "Capture something you want to remember"}
          </p>
        </div>

        {editingNote && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        )}

      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* Title */}
        <div>

          <label
            htmlFor="note-title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Title
          </label>

          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          />

        </div>

        {/* Content */}
        <div>

          <label
            htmlFor="note-content"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Content
          </label>

          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            rows={8}
            disabled={loading}
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          />

        </div>

        {/* Buttons */}
        <div className="flex gap-3">

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editingNote
              ? "Update Note"
              : "Save Note"}
          </button>

          {editingNote && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

        </div>

      </form>

    </div>
  );
}

export default NoteForm;

