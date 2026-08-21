import { useState } from "react";

function NoteCard({
  note,
  onEdit,
  onDelete,
  onAnalyze,
  onView,
}) {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);

    try {
      await onAnalyze(note._id);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      {/* TITLE */}

      <div className="mb-4 flex items-start justify-between gap-3">

        <h3 className="text-lg font-bold text-slate-900">
          {note.title}
        </h3>

        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {note.category || "Other"}
        </span>

      </div>


      {/* CONTENT */}

      <p className="line-clamp-4 text-sm leading-6 text-slate-600">
        {note.content}
      </p>


      {/* TAGS */}

      {note.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">

          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
            >
              #{tag}
            </span>
          ))}

        </div>
      )}


      {/* ACTIONS */}

      <div className="mt-5 grid grid-cols-2 gap-2">

        <button
          onClick={() => onView(note)}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          View Note
        </button>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {analyzing
            ? "Analyzing..."
            : note.summary
            ? "✨ Analyze Again"
            : "✨ Analyze AI"}
        </button>

      </div>


      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between border-t pt-4">

        <p className="text-xs text-slate-400">
          {note.createdAt
            ? new Date(note.createdAt).toLocaleDateString()
            : ""}
        </p>

        <div className="flex gap-2">

          <button
            onClick={() => onEdit(note)}
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(note._id)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>

        </div>

      </div>

    </article>
  );
}

export default NoteCard;
