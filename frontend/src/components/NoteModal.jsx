function NoteModal({ note, onClose }) {
  if (!note) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >

      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-2xl font-bold text-slate-900">
                {note.title}
              </h2>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {note.category}
              </span>

            </div>

            <p className="mt-1 text-sm text-slate-400">
              {note.createdAt
                ? new Date(note.createdAt).toLocaleDateString()
                : ""}
            </p>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
          >
            ×
          </button>

        </div>


        {/* CONTENT */}

        <div className="mt-6">

          <h3 className="mb-2 font-semibold text-slate-900">
            Note
          </h3>

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {note.content}
          </p>

        </div>


        {/* SUMMARY */}

        {note.summary && (
          <div className="mt-6 rounded-xl bg-slate-50 p-5">

            <h3 className="mb-2 font-semibold text-slate-900">
              ✨ AI Summary
            </h3>

            <p className="text-sm leading-7 text-slate-700">
              {note.summary}
            </p>

          </div>
        )}


        {/* KEY POINTS */}

        {note.keyPoints?.length > 0 && (
          <div className="mt-6">

            <h3 className="mb-3 font-semibold text-slate-900">
              💡 Key Points
            </h3>

            <ul className="space-y-2">

              {note.keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="text-sm text-slate-700"
                >
                  • {point}
                </li>
              ))}

            </ul>

          </div>
        )}


        {/* TAGS */}

        {note.tags?.length > 0 && (
          <div className="mt-6">

            <h3 className="mb-3 font-semibold text-slate-900">
              🏷️ Tags
            </h3>

            <div className="flex flex-wrap gap-2">

              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  #{tag}
                </span>
              ))}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default NoteModal;