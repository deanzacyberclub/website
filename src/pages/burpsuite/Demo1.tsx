import { useState } from "react";
import { Link } from "react-router-dom";

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-6">
            <img src="/hive.png" alt="The Hive" className="w-16 h-16 mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {username}!</h1>
            <p className="text-gray-500 text-sm">You're now connected to The Hive</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-amber-700">Session Token:</span>
              <br />
              <code className="text-xs font-mono text-gray-600">abc123-fake-session-token-xyz789</code>
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
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Logout
          </button>

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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/hive.png" alt="The Hive" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">The Hive</h1>
          <p className="text-gray-500 text-sm">Connect with your swarm</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-4">
          Version 2.3.1 | Web Client
        </p>

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

export default Demo1;
