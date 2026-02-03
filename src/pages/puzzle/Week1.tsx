import { useState } from "react";

function PuzzleWeek1() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");
  const [flag, setFlag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");
    setFlag("");

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch("/api/puzzle/week1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType("success");
        setMessage(data.message);
        if (data.flag) {
          setFlag(data.flag);
        }
      } else {
        setMessageType("error");
        setMessage(data.message || "Authentication failed");
      }
    } catch (err) {
      setMessageType("error");
      setMessage("Connection error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div
        dangerouslySetInnerHTML={{
          __html: `<!--
  Nexus Systems Employee Portal v3.2.1
  Internal use only - authorized personnel

  TODO: Remove before production
  Debug endpoint: /api/puzzle/week1/employees?id=
  Default employee range: 1001-1010
-->`
        }}
      />

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded mb-4">
              <span className="text-white text-2xl font-light">N</span>
            </div>
            <h1 className="text-xl font-normal text-gray-900">Nexus Systems</h1>
            <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                required
              />
            </div>

            <div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "..." : "Sign In"}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded text-sm ${
              messageType === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              {message}
            </div>
          )}

          {/* Flag Display */}
          {flag && (
            <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
              <p className="text-xs text-gray-500 mb-1">FLAG</p>
              <code className="text-sm font-mono text-gray-900 break-all">{flag}</code>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
}

export default PuzzleWeek1;
