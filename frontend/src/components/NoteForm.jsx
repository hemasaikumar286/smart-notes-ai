import { useEffect, useState } from "react";

function NoteForm({
  editingNote,
  onNoteCreated,
  onNoteUpdated,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [editingNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please enter both title and content.");
      return;
    }

    setLoading(true);

    try {
      const url = editingNote
        ? `http://localhost:5000/api/notes/${editingNote._id}`
        : "http://localhost:5000/api/notes";

      const method = editingNote ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();

      if (editingNote) {
        onNoteUpdated(data);
      } else {
        onNoteCreated(data);
      }

      setTitle("");
      setContent("");

    } catch (error) {
      console.error(error);
      alert("Failed to save note.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >

      <div>

        <label className="mb-2 block text-sm font-medium">
          Title
        </label>

        <input
          type="text"
          placeholder="Enter note title..."
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />

      </div>

      <div>

        <label className="mb-2 block text-sm font-medium">
          Content
        </label>

        <textarea
          placeholder="Write your note here..."
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          rows="8"
          className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
        />

      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : editingNote
          ? "Update Note"
          : "Save Note"}
      </button>

    </form>
  );
}

export default NoteForm;
