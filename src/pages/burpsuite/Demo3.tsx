import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Mail } from "@/lib/cyberIcon";

const validUsernames = ["jsmith", "admin", "ceo", "hradmin"];

function Demo3() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(5);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create form data for the login request
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      // Make a real HTTP request that Burp Suite can intercept
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLoggedIn(true);
      } else {
        setError(data.message || "Authentication failed");
        if (data.message !== "User not found") {
          setAttempts(Math.max(0, attempts - 1));
        }
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error("API Error:", err);
    }

    setLoading(false);
  };

  if (loggedIn) {
    return (
      <div className="bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen">
        <div className="crt-overlay" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <Link
            to="/burpsuite"
            className="inline-flex items-center gap-2 text-gray-900 dark:text-matrix hover:text-blue-600 dark:hover:neon-text-subtle transition-all mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Demos
          </Link>

          <div className="card-hack p-8 rounded-lg text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-matrix mb-4">Inbox</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Welcome to Acme Corp Webmail</p>
            <div className="space-y-3">
              <div className="p-4 rounded bg-gray-50 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">From:</span> HR Department
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">Subject:</span> Welcome to the system
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setLoggedIn(false);
                setUsername("");
                setPassword("");
                setError("");
                setAttempts(5);
              }}
              className="mt-6 btn-hack rounded-lg px-6 py-3"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <Link
          to="/burpsuite"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-matrix hover:text-blue-600 dark:hover:neon-text-subtle transition-all mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Demos
        </Link>

        <div className="max-w-md mx-auto">
          {/* Login Form */}
          <div>
            <div className="card-hack p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-8 h-8 text-gray-900 dark:text-matrix" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acme Webmail</h1>
                  <p className="text-gray-600 dark:text-gray-500 text-sm">Corporate Email System</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm font-semibold">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-matrix focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-matrix focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || attempts === 0}
                  className="w-full btn-hack-filled rounded-lg py-3 font-semibold disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-500">
                    Attempts remaining: <span className="text-blue-600 dark:text-matrix font-bold">{attempts}</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo3;
