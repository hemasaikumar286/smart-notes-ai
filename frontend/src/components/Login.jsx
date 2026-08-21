import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login({ onRegister }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      login(data);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">

          <div className="mb-3 text-4xl">
            🧠
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Smart Notes
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your AI-powered second brain
          </p>

        </div>


        <form onSubmit={handleSubmit} className="space-y-5">

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400"
            />

          </div>


          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-400"
            />

          </div>


          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>


        <div className="mt-6 text-center text-sm text-slate-500">

          Don't have an account?

          <button
            onClick={onRegister}
            className="ml-1 font-semibold text-slate-900 hover:underline"
          >
            Create account
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;