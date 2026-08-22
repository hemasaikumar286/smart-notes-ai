import { useEffect, useState } from "react";

import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const {
    user,
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [showRegister, setShowRegister] = useState(false);

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  // ==========================================
  // LOAD NOTES
  // ==========================================

  const fetchNotes = async () => {
    if (!token) return;

    try {
      setLoadingNotes(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/notes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load notes"
        );
      }

      setNotes(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Fetch notes error:", error);
      setError(error.message || "Failed to load notes");

    } finally {
      setLoadingNotes(false);
    }
  };

  // ==========================================
  // LOAD NOTES WHEN USER LOGS IN
  // ==========================================

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  // ==========================================
  // SELECT NOTE
  // ==========================================

  const handleSelectNote = (note) => {
    setSelectedNote(note);

    setTitle(note.title || "");
    setContent(note.content || "");

    setAnswer("");
    setQuestion("");
    setError("");
  };

  // ==========================================
  // NEW NOTE
  // ==========================================

  const handleNewNote = () => {
    setSelectedNote(null);

    setTitle("");
    setContent("");

    setAnswer("");
    setQuestion("");
    setError("");
  };

  // ==========================================
  // SAVE NOTE
  // ==========================================

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!content.trim()) {
      setError("Please enter note content.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = selectedNote
        ? `${API_URL}/api/notes/${selectedNote._id}`
        : `${API_URL}/api/notes`;

      const method = selectedNote ? "PUT" : "POST";

      const response = await fetch(url, {
        method,

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

      if (selectedNote) {
        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note._id === data._id ? data : note
          )
        );

        setSelectedNote(data);
      } else {
        setNotes((previousNotes) => [
          data,
          ...previousNotes,
        ]);

        setSelectedNote(data);
      }

      setTitle(data.title || title);
      setContent(data.content || content);

    } catch (error) {
      console.error("Save note error:", error);
      setError(error.message || "Failed to save note");

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE NOTE
  // ==========================================

  const handleDelete = async () => {
    if (!selectedNote?._id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/notes/${selectedNote._id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      setNotes((previousNotes) =>
        previousNotes.filter(
          (note) => note._id !== selectedNote._id
        )
      );

      handleNewNote();

    } catch (error) {
      console.error("Delete note error:", error);
      setError(error.message || "Failed to delete note");

    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // AI SUMMARIZE / ANALYZE
  // ==========================================

  const handleAISummarize = async () => {
    if (!selectedNote) {
      setError("Please select a note first.");
      return;
    }

    const noteId = selectedNote._id;

    if (!noteId) {
      console.error(
        "Selected note has no ID:",
        selectedNote
      );

      setError(
        "Cannot analyze this note because the note ID is missing."
      );

      return;
    }

    try {
      setAnalyzing(true);
      setError("");

      console.log(
        "AI analyzing note:",
        noteId
      );

      const response = await fetch(
        `${API_URL}/api/ai/summarize/${noteId}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "AI response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "AI analysis failed"
        );
      }

      if (data.note) {
        setSelectedNote(data.note);

        setTitle(data.note.title || "");
        setContent(data.note.content || "");

        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note._id === data.note._id
              ? data.note
              : note
          )
        );
      }

      console.log(
        "AI analysis completed successfully"
      );

    } catch (error) {
      console.error(
        "AI summarize error:",
        error
      );

      setError(
        error.message ||
        "AI analysis failed"
      );

    } finally {
      setAnalyzing(false);
    }
  };

  // ==========================================
  // ASK AI
  // ==========================================

  const handleAsk = async (event) => {
    event.preventDefault();

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setAsking(true);
      setError("");
      setAnswer("");

      const response = await fetch(
        `${API_URL}/api/ai/ask`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            question: question.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "AI request failed"
        );
      }

      setAnswer(
        data.answer ||
        data.response ||
        data.message ||
        "No answer received."
      );

    } catch (error) {
      console.error(
        "Ask AI error:",
        error
      );

      setError(
        error.message ||
        "AI request failed"
      );

    } finally {
      setAsking(false);
    }
  };

  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mb-3 text-4xl">
            🧠
          </div>

          <p className="text-slate-500">
            Loading Smart Notes...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGIN / REGISTER
  // ==========================================

  if (!user) {
    if (showRegister) {
      return (
        <Register
          onLogin={() =>
            setShowRegister(false)
          }
        />
      );
    }

    return (
      <Login
        onRegister={() =>
          setShowRegister(true)
        }
      />
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-2xl">
              🧠
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Smart Notes
              </h1>

              <p className="text-xs text-slate-500">
                AI-powered knowledge manager
              </p>
            </div>

          </div>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-900">
                {user.name}
              </p>

              <p className="text-xs text-slate-500">
                {user.email}
              </p>

            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="mx-auto max-w-7xl px-6 py-6">

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <span>
              {error}
            </span>

            <button
              onClick={() => setError("")}
              className="ml-4 font-bold"
            >
              ×
            </button>

          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">

          {/* ==================================
              SIDEBAR
          ================================== */}

          <aside className="lg:col-span-3">

            <div className="rounded-2xl border bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-4">

                <div>
                  <h2 className="font-semibold text-slate-900">
                    My Notes
                  </h2>

                  <p className="text-xs text-slate-500">
                    {notes.length} note
                    {notes.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <button
                  onClick={handleNewNote}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  + New
                </button>

              </div>

              <div className="max-h-[600px] overflow-y-auto">

                {loadingNotes ? (

                  <div className="p-6 text-center text-sm text-slate-500">
                    Loading notes...
                  </div>

                ) : notes.length === 0 ? (

                  <div className="p-6 text-center">

                    <div className="mb-3 text-3xl">
                      📝
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      No notes yet
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Create your first note.
                    </p>

                  </div>

                ) : (

                  <div className="divide-y">

                    {notes.map((note) => (

                      <button
                        key={note._id}
                        onClick={() =>
                          handleSelectNote(note)
                        }
                        className={`w-full p-4 text-left transition hover:bg-slate-50 ${
                          selectedNote?._id ===
                          note._id
                            ? "bg-slate-100"
                            : ""
                        }`}
                      >

                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {note.title ||
                            "Untitled"}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {note.content ||
                            "No content"}
                        </p>

                        {note.category && (
                          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                            {note.category}
                          </span>
                        )}

                      </button>

                    ))}

                  </div>

                )}

              </div>

            </div>

          </aside>

          {/* ==================================
              NOTE EDITOR
          ================================== */}

          <section className="lg:col-span-5">

            <div className="rounded-2xl border bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-4">

                <div>

                  <h2 className="font-semibold text-slate-900">
                    {selectedNote
                      ? "Edit Note"
                      : "New Note"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Write your thoughts and let AI organize them.
                  </p>

                </div>

                {selectedNote && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                )}

              </div>

              <div className="p-5">

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Note title"
                  className="mb-4 w-full border-0 border-b border-slate-200 pb-3 text-xl font-semibold text-slate-900 outline-none placeholder:text-slate-300 focus:border-slate-500"
                />

                <textarea
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="Start writing your note..."
                  rows={18}
                  className="w-full resize-none border-0 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-300"
                />

                <div className="mt-4 flex flex-wrap gap-3">

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : selectedNote
                        ? "Update Note"
                        : "Save Note"}
                  </button>

                  {selectedNote && (
                    <button
                      onClick={handleAISummarize}
                      disabled={analyzing}
                      className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {analyzing
                        ? "AI Analyzing..."
                        : "✨ Analyze with AI"}
                    </button>
                  )}

                </div>

              </div>

            </div>

            {/* =================================
                AI ANALYSIS
            ================================= */}

            {selectedNote &&
              (
                selectedNote.summary ||
                selectedNote.keyPoints?.length > 0 ||
                selectedNote.tags?.length > 0 ||
                selectedNote.category
              ) && (

                <div className="mt-6 rounded-2xl border bg-white shadow-sm">

                  <div className="border-b p-4">

                    <h2 className="font-semibold text-slate-900">
                      ✨ AI Analysis
                    </h2>

                  </div>

                  <div className="space-y-5 p-5">

                    {/* SUMMARY */}

                    {selectedNote.summary && (
                      <div>

                        <h3 className="mb-2 text-sm font-semibold text-slate-900">
                          Summary
                        </h3>

                        <p className="text-sm leading-6 text-slate-600">
                          {selectedNote.summary}
                        </p>

                      </div>
                    )}

                    {/* KEY POINTS */}

                    {selectedNote.keyPoints?.length > 0 && (
                      <div>

                        <h3 className="mb-2 text-sm font-semibold text-slate-900">
                          Key Points
                        </h3>

                        <ul className="space-y-2">

                          {selectedNote.keyPoints.map(
                            (point, index) => (
                              <li
                                key={index}
                                className="flex gap-2 text-sm text-slate-600"
                              >
                                <span>
                                  •
                                </span>

                                <span>
                                  {point}
                                </span>
                              </li>
                            )
                          )}

                        </ul>

                      </div>
                    )}

                    {/* TAGS */}

                    {selectedNote.tags?.length > 0 && (
                      <div>

                        <h3 className="mb-2 text-sm font-semibold text-slate-900">
                          Tags
                        </h3>

                        <div className="flex flex-wrap gap-2">

                          {selectedNote.tags.map(
                            (tag, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {tag}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {/* CATEGORY */}

                    {selectedNote.category && (
                      <div>

                        <h3 className="mb-2 text-sm font-semibold text-slate-900">
                          Category
                        </h3>

                        <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                          {selectedNote.category}
                        </span>

                      </div>
                    )}

                  </div>

                </div>
              )}

          </section>

          {/* ==================================
              ASK MY NOTES
          ================================== */}

          <aside className="lg:col-span-4">

            <div className="rounded-2xl border bg-white shadow-sm">

              <div className="border-b p-5">

                <h2 className="font-semibold text-slate-900">
                  🤖 Ask My Notes
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Ask questions about your notes.
                  AI will search your knowledge base
                  and answer using your information.
                </p>

              </div>

              <div className="p-5">

                <form onSubmit={handleAsk}>

                  <textarea
                    value={question}
                    onChange={(event) =>
                      setQuestion(event.target.value)
                    }
                    placeholder="Example: What did I learn about Java?"
                    rows={5}
                    className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={asking}
                    className="mt-3 w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {asking
                      ? "AI Thinking..."
                      : "Ask AI"}
                  </button>

                </form>

                {/* AI ANSWER */}

                {answer && (
                  <div className="mt-5 rounded-xl border bg-slate-50 p-4">

                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      🤖 AI Answer
                    </h3>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {answer}
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* ==================================
                STATS
            ================================== */}

            <div className="mt-6 grid grid-cols-2 gap-4">

              <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <p className="text-xs font-medium text-slate-500">
                  Total Notes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {notes.length}
                </p>

              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <p className="text-xs font-medium text-slate-500">
                  AI Analyzed
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {
                    notes.filter(
                      (note) =>
                        note.summary ||
                        note.keyPoints?.length > 0 ||
                        note.tags?.length > 0
                    ).length
                  }
                </p>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default App;