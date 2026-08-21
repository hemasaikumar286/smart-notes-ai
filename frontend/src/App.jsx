import { useEffect, useState } from "react";

import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import NoteCard from "./components/NoteCard";
import NoteModal from "./components/NoteModal";

const API_URL = "http://localhost:5000";

function App() {
  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const {
    user,
    token,
    loading: authLoading,
    logout,
  } = useAuth();

  const [showRegister, setShowRegister] = useState(false);


  // ==========================================
  // NOTES
  // ==========================================

  const [notes, setNotes] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);


  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");


  // ==========================================
  // AI
  // ==========================================

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [asking, setAsking] = useState(false);


  // ==========================================
  // NOTE MODAL
  // ==========================================

  const [selectedNote, setSelectedNote] = useState(null);


  // ==========================================
  // LOAD NOTES
  // ==========================================

  const fetchNotes = async () => {
    if (!token) {
      return;
    }

    setLoadingNotes(true);

    try {
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

      setNotes(data);

    } catch (error) {
      console.error("Fetch Notes Error:", error);

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
    } else {
      setNotes([]);
    }
  }, [token]);


  // ==========================================
  // CREATE / UPDATE NOTE
  // ==========================================

  const handleSubmitNote = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please enter both title and content.");
      return;
    }

    setSaving(true);

    try {
      let response;

      if (editingId) {
        // UPDATE
        response = await fetch(
          `${API_URL}/api/notes/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title,
              content,
            }),
          }
        );
      } else {
        // CREATE
        response = await fetch(
          `${API_URL}/api/notes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title,
              content,
            }),
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save note"
        );
      }

      if (editingId) {
        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            note._id === editingId
              ? data
              : note
          )
        );
      } else {
        setNotes((currentNotes) => [
          data,
          ...currentNotes,
        ]);
      }

      setTitle("");
      setContent("");
      setEditingId(null);

    } catch (error) {
      console.error("Save Note Error:", error);
      alert(error.message);

    } finally {
      setSaving(false);
    }
  };


  // ==========================================
  // EDIT NOTE
  // ==========================================

  const handleEdit = (note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };


  // ==========================================
  // DELETE NOTE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notes/${id}`,
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

      setNotes((currentNotes) =>
        currentNotes.filter(
          (note) => note._id !== id
        )
      );

      if (selectedNote?._id === id) {
        setSelectedNote(null);
      }

    } catch (error) {
      console.error("Delete Note Error:", error);
      alert(error.message);
    }
  };


  // ==========================================
  // AI ANALYZE
  // ==========================================

  const handleAnalyze = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/ai/summarize/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "AI analysis failed"
        );
      }

      // Update note in state
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note._id === id
            ? {
                ...note,
                ...data,
              }
            : note
        )
      );

      // Update open modal if necessary
      if (selectedNote?._id === id) {
        setSelectedNote((currentNote) => ({
          ...currentNote,
          ...data,
        }));
      }

    } catch (error) {
      console.error("AI Analysis Error:", error);
      alert(error.message);
    }
  };


  // ==========================================
  // ASK AI
  // ==========================================

  const handleAsk = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    setAsking(true);
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(
        `${API_URL}/api/ai/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to get AI answer"
        );
      }

      setAnswer(data.answer || "");
      setSources(data.sources || []);

    } catch (error) {
      console.error("Ask AI Error:", error);

      setAnswer(`Error: ${error.message}`);
      setSources([]);

    } finally {
      setAsking(false);
    }
  };


  // ==========================================
  // FILTER NOTES
  // ==========================================

  const filteredNotes = notes.filter((note) => {
    const searchText = search.toLowerCase();

    return (
      note.title?.toLowerCase().includes(searchText) ||
      note.content?.toLowerCase().includes(searchText) ||
      note.category?.toLowerCase().includes(searchText) ||
      note.tags?.some((tag) =>
        tag.toLowerCase().includes(searchText)
      )
    );
  });


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
          onLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <Login
        onRegister={() => setShowRegister(true)}
      />
    );
  }


  // ==========================================
  // MAIN APP
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ======================================
          HEADER
      ======================================= */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* LOGO */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-2xl">
              🧠
            </div>

            <div>

              <h1 className="text-xl font-bold text-slate-900">
                Smart Notes
              </h1>

              <p className="text-xs text-slate-500">
                Your AI-powered second brain
              </p>

            </div>

          </div>


          {/* USER */}

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
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* ======================================
          MAIN
      ======================================= */}

      <main className="mx-auto max-w-7xl px-6 py-8">


        {/* ====================================
            WELCOME
        ===================================== */}

        <section className="mb-8">

          <h2 className="text-3xl font-bold text-slate-900">
            Welcome back, {user.name}! 👋
          </h2>

          <p className="mt-2 text-slate-500">
            Capture your ideas and let AI organize
            your knowledge.
          </p>

        </section>


        {/* ====================================
            STATISTICS
        ===================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border bg-white p-5">

            <p className="text-sm text-slate-500">
              Total Notes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {notes.length}
            </p>

          </div>


          <div className="rounded-xl border bg-white p-5">

            <p className="text-sm text-slate-500">
              AI Analyzed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                notes.filter(
                  (note) => note.summary
                ).length
              }
            </p>

          </div>


          <div className="rounded-xl border bg-white p-5">

            <p className="text-sm text-slate-500">
              Categories
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                new Set(
                  notes
                    .map((note) => note.category)
                    .filter(Boolean)
                ).size
              }
            </p>

          </div>

        </section>


        {/* ====================================
            CREATE NOTE
        ===================================== */}

        <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">

                {editingId
                  ? "✏️ Edit Note"
                  : "📝 Create New Note"}

              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingId
                  ? "Update your note."
                  : "Write anything and let AI organize it."}
              </p>

            </div>

          </div>


          <form
            onSubmit={handleSubmitNote}
            className="space-y-4"
          >

            {/* TITLE */}

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Note title..."
              className="w-full rounded-lg border px-4 py-3 text-lg font-medium outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />


            {/* CONTENT */}

            <textarea
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="Write your note here..."
              rows={7}
              className="w-full resize-y rounded-lg border px-4 py-3 text-sm leading-7 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />


            {/* BUTTONS */}

            <div className="flex flex-wrap gap-3">

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Note"
                  : "Create Note"}
              </button>


              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>


        {/* ====================================
            ASK MY NOTES
        ===================================== */}

        <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">

          <div className="mb-5">

            <h2 className="text-xl font-bold text-slate-900">
              🤖 Ask My Notes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ask questions and AI will search your
              notes intelligently.
            </p>

          </div>


          <form
            onSubmit={handleAsk}
            className="flex flex-col gap-3 sm:flex-row"
          >

            <input
              type="text"
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              placeholder="Example: What did I learn about Java?"
              className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />

            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {asking ? "Thinking..." : "Ask AI"}
            </button>

          </form>


          {/* AI ANSWER */}

          {answer && (
            <div className="mt-6 rounded-xl border bg-slate-50 p-5">

              <h3 className="mb-3 font-semibold text-slate-900">
                ✨ AI Answer
              </h3>

              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {answer}
              </p>


              {/* SOURCES */}

              {sources.length > 0 && (
                <div className="mt-6 border-t pt-5">

                  <h4 className="mb-3 text-sm font-semibold text-slate-900">
                    📚 Sources from your notes
                  </h4>

                  <div className="space-y-2">

                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
                      >

                        <div className="flex items-center gap-3">

                          <span className="text-lg">
                            📄
                          </span>

                          <span className="text-sm font-medium text-slate-700">
                            {source.title}
                          </span>

                        </div>


                        {source.score !==
                          undefined && (
                          <span className="text-xs text-slate-400">
                            {(
                              source.score * 100
                            ).toFixed(0)}
                            % match
                          </span>
                        )}

                      </div>
                    ))}

                  </div>

                </div>
              )}

            </div>
          )}

        </section>


        {/* ====================================
            NOTES HEADER
        ===================================== */}

        <section>

          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                My Notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredNotes.length}{" "}
                {filteredNotes.length === 1
                  ? "note"
                  : "notes"}
              </p>

            </div>


            {/* SEARCH */}

            <div className="w-full sm:w-80">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="🔍 Search notes..."
                className="w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />

            </div>

          </div>


          {/* LOADING */}

          {loadingNotes && (
            <div className="rounded-xl border bg-white p-10 text-center">

              <p className="text-slate-500">
                Loading your notes...
              </p>

            </div>
          )}


          {/* EMPTY */}

          {!loadingNotes &&
            filteredNotes.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-white p-12 text-center">

                <div className="mb-4 text-5xl">
                  📝
                </div>

                <h3 className="text-lg font-semibold text-slate-900">
                  {search
                    ? "No notes found"
                    : "No notes yet"}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {search
                    ? "Try a different search."
                    : "Create your first note above."}
                </p>

              </div>
            )}


          {/* NOTES GRID */}

          {!loadingNotes &&
            filteredNotes.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAnalyze={handleAnalyze}
                    onView={(noteToView) =>
                      setSelectedNote(
                        noteToView
                      )
                    }
                  />
                ))}

              </div>
            )}

        </section>

      </main>


      {/* ======================================
          NOTE MODAL
      ======================================= */}

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() =>
            setSelectedNote(null)
          }
        />
      )}

    </div>
  );
}

export default App;
