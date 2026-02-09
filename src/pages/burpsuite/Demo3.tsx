import { useState } from "react";
import { Link } from "react-router-dom";

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
      <div className="min-h-screen bg-gray-100">
        {/* Top Nav */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <img src="/hive.png" alt="The Hive" className="w-8 h-8 rounded-lg" />
                <span className="text-xl font-bold text-gray-900">The Hive</span>
              </div>
              <span className="text-sm text-gray-500">Messages</span>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                <p className="text-gray-500 text-sm">Welcome to The Hive Messages</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                    HR
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">HR Department</p>
                    <p className="text-sm text-gray-600">Welcome to the system</p>
                  </div>
                  <span className="text-xs text-gray-400">Just now</span>
                </div>
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
              className="mt-6 w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              to="/burpsuite"
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              ← Back to Burp Suite Demos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/hive.png" alt="The Hive" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">The Hive</h1>
          <p className="text-gray-500 text-sm">Sign in to your messages</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || attempts === 0}
            className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Attempts remaining: <span className="text-amber-600 font-bold">{attempts}</span>
            </p>
          </div>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to="/burpsuite"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            ← Back to Burp Suite Demos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Demo3;
