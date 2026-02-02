import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Flag, Lock } from "@/lib/cyberIcon";

function CTF() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [userRole, setUserRole] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardError, setDashboardError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("client_id", "web-portal-v3");

    try {
      const response = await fetch("/api/burpsuite/ctf/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSessionToken(data.token);
        setUserRole(data.role);
        setLoggedIn(true);
      } else {
        alert(`Login failed: ${data.message || "Invalid credentials"}`);
      }
    } catch (err) {
      alert("Connection error. Please try again.");
      console.error("API Error:", err);
    }

    setLoading(false);
  };

  const handleAccessDashboard = async () => {
    setLoading(true);
    setDashboardError("");
    setDashboardData(null);

    try {
      const response = await fetch("/api/burpsuite/ctf/dashboard", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "X-Client-Version": "3.1.0",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDashboardData(data);
      } else {
        setDashboardError(data.message || "Access denied");
      }
    } catch (err) {
      setDashboardError("Connection error. Please try again.");
      console.error("API Error:", err);
    }

    setLoading(false);
  };

  if (loggedIn) {
    return (
      <div className="bg-terminal-bg text-matrix min-h-screen">
        <div className="crt-overlay" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <Link
            to="/burpsuite"
            className="inline-flex items-center gap-2 text-matrix hover:neon-text-subtle transition-all mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Demos
          </Link>

          <div className="space-y-6">
            <div className="card-hack p-8 rounded-lg">
              <h1 className="text-3xl font-bold text-matrix mb-4">
                Welcome, {username}!
              </h1>
              <p className="text-gray-400 mb-6">
                You are logged into the Acme Corp Employee Portal
              </p>

              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-lg bg-terminal-alt border border-gray-700">
                  <p className="text-sm text-gray-400">
                    <span className="text-matrix font-bold">Role:</span> {userRole}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-terminal-alt border border-gray-700">
                  <p className="text-sm text-gray-400 break-all">
                    <span className="text-matrix font-bold">Session Token:</span>{" "}
                    <span className="font-mono text-xs">{sessionToken}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleAccessDashboard}
                disabled={loading}
                className="w-full btn-hack-filled rounded-lg py-3 font-semibold mb-4 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Access Executive Dashboard"}
              </button>

              {dashboardError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 font-semibold">{dashboardError}</p>
                  </div>
                </div>
              )}

              {dashboardData && (
                <div className="p-6 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Flag className="w-6 h-6 text-green-400" />
                    <h2 className="text-2xl font-bold text-green-400">Access Granted!</h2>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-300">{dashboardData.message}</p>
                    <div className="p-4 rounded bg-terminal-alt border border-green-500/50">
                      <p className="text-sm text-gray-400 mb-2">🚩 FLAG:</p>
                      <code className="text-green-400 font-mono text-lg font-bold break-all">
                        {dashboardData.flag}
                      </code>
                    </div>
                    {dashboardData.congratulations && (
                      <p className="text-sm text-gray-400 italic">{dashboardData.congratulations}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setLoggedIn(false);
                  setUsername("");
                  setPassword("");
                  setSessionToken("");
                  setUserRole("");
                  setDashboardData(null);
                  setDashboardError("");
                }}
                className="mt-6 btn-hack rounded-lg px-6 py-3"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <Link
          to="/burpsuite"
          className="inline-flex items-center gap-2 text-matrix hover:neon-text-subtle transition-all mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Demos
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <div>
            <div className="card-hack p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <Flag className="w-8 h-8 text-matrix" />
                <div>
                  <h1 className="text-2xl font-bold text-white">CTF Challenge</h1>
                  <p className="text-gray-500 text-sm">Capture The Flag</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-400 font-semibold mb-2">Mission:</p>
                <p className="text-sm text-gray-400">
                  Access the Executive Dashboard to retrieve the flag. You'll need to use
                  Proxy, Repeater, and Intruder to solve this challenge.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-terminal-alt border border-gray-700 rounded-lg text-white focus:border-matrix focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-terminal-alt border border-gray-700 rounded-lg text-white focus:border-matrix focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-hack-filled rounded-lg py-3 font-semibold disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Test Credentials:</p>
                <code className="text-xs text-matrix font-mono">employee / welcome123</code>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <div className="card-hack p-6 rounded-lg border-matrix/30 bg-matrix/5">
              <h2 className="text-xl font-bold text-matrix mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5" />
                CTF Challenge: The Promoted Employee
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                You are a regular employee at Acme Corp. Rumor has it that the Executive Dashboard contains sensitive information. Can you escalate your privileges to access it?
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">Hints:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Use <span className="text-matrix font-mono">Proxy</span> to inspect login responses carefully</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Look for hidden headers or comments that reveal system behavior</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Use <span className="text-matrix font-mono">Repeater</span> to test modifications to requests</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>The token structure might not be as secure as it appears</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Use <span className="text-matrix font-mono">Intruder</span> when you need to test multiple values</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Corporate roles follow a specific hierarchy pattern</span>
                </li>
              </ul>
            </div>

            <div className="card-hack p-6 rounded-lg border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold text-red-400 mb-3">Vulnerability Type:</h3>
              <p className="text-sm text-gray-400">
                This challenge demonstrates <span className="text-red-400 font-bold">insecure token handling</span> and <span className="text-red-400 font-bold">insufficient authorization checks</span>. Similar vulnerabilities have been found in real-world enterprise applications where client-side tokens are trusted without proper server-side validation.
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg bg-yellow-500/5 border-yellow-500/30">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">⚠️ Challenge Rules:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Use only Burp Suite techniques covered in Demos 1-3</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>No source code inspection allowed (yet!)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Document your methodology as you go</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>First person to capture the flag wins!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CTF;
