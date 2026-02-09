import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "@/lib/cyberIcon";

function Demo1() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create form data just like a real insecure form would
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("remember", remember ? "on" : "off");
    formData.append("app_version", "2.3.1");
    formData.append("client_type", "web");

    try {
      // Make a real HTTP request that Burp Suite can intercept
      const response = await fetch("/api/burpsuite/demo1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      // The server validates the password (including any Burp Suite modifications!)
      if (response.ok && data.success) {
        // Set a fake session cookie
        document.cookie = `SESSIONID=${data.sessionId}; path=/`;
        setLoading(false);
        setLoggedIn(true);
      } else {
        setLoading(false);
        alert(`Authentication failed. ${data.message || "Invalid credentials."}`);
      }
    } catch (err) {
      setLoading(false);
      alert("Connection error. Please try again.");
      console.error("API Error:", err);
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-matrix mb-4">
              Welcome back, {username}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have successfully logged into the Acme Corp Employee Portal.
            </p>
            <div className="p-4 rounded-lg bg-matrix/10 border border-matrix/30">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-gray-900 dark:text-matrix font-bold">Session Token:</span> abc123-fake-session-token-xyz789
              </p>
            </div>
            <button
              onClick={() => {
                setLoggedIn(false);
                setUsername("");
                setPassword("");
                setRemember(false);
                document.cookie = "SESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
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
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%2300ff41'/%3E%3Ctext x='50%25' y='50%25' font-family='monospace' font-size='20' fill='%23000' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E"
                  alt="Acme Corp"
                  className="w-10 h-10 rounded"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acme Corp</h1>
                  <p className="text-gray-600 dark:text-gray-500 text-sm">Employee Portal</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-200 dark:border-gray-700 text-gray-900 dark:text-matrix focus:ring-matrix"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-hack-filled rounded-lg py-3 font-semibold disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center text-gray-600 dark:text-gray-500 text-xs mt-4">
                Version 2.3.1 | Web Client
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo1;
