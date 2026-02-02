import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Flag, Lock, Clock } from "@/lib/cyberIcon";

function Dashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginAttempts(prev => prev + 1);

    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch("/api/burpsuite/dashboard/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAccessToken(data.access_token);
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
      const response = await fetch("/api/burpsuite/dashboard/data", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
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
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <Link
            to="/burpsuite"
            className="inline-flex items-center gap-2 text-matrix hover:neon-text-subtle transition-all mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Demos
          </Link>

          <div className="space-y-6">
            <div className="card-hack p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Authenticated Successfully</h1>
                  <p className="text-gray-400 text-sm">Welcome to the Acme Analytics Dashboard</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-terminal-alt border border-gray-700 mb-6">
                <p className="text-sm text-gray-400 mb-1">
                  <span className="text-matrix font-bold">Email:</span> {email}
                </p>
                <p className="text-sm text-gray-400 break-all">
                  <span className="text-matrix font-bold">Access Token:</span>{" "}
                  <span className="font-mono text-xs">{accessToken}</span>
                </p>
              </div>

              <button
                onClick={handleAccessDashboard}
                disabled={loading}
                className="w-full btn-hack-filled rounded-lg py-3 font-semibold mb-4 disabled:opacity-50"
              >
                {loading ? "Loading..." : "View Executive Dashboard"}
              </button>

              {dashboardError && (
                <div className="p-6 rounded-lg bg-red-500/10 border-2 border-red-500/30 mb-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                    <div>
                      <p className="text-red-400 font-semibold mb-2">{dashboardError}</p>
                      <p className="text-sm text-gray-400">
                        You don't have the required permissions to access the executive dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {dashboardData && (
                <div className="p-6 rounded-lg bg-green-500/10 border-2 border-green-500/30 animate-pulse-slow">
                  <div className="flex items-center gap-3 mb-4">
                    <Flag className="w-8 h-8 text-green-400" />
                    <h2 className="text-2xl font-bold text-green-400">🎉 Congratulations!</h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-300">{dashboardData.message}</p>
                    <div className="p-6 rounded-lg bg-terminal-alt border-2 border-green-500/50">
                      <p className="text-sm text-gray-400 mb-3 font-bold">🚩 FLAG CAPTURED:</p>
                      <code className="text-green-400 font-mono text-xl font-bold break-all block p-3 bg-black/30 rounded">
                        {dashboardData.flag}
                      </code>
                    </div>
                    {dashboardData.methodology && (
                      <div className="p-4 rounded bg-blue-500/10 border border-blue-500/30">
                        <p className="text-sm text-blue-400 font-bold mb-2">💡 Solution Path:</p>
                        <p className="text-xs text-gray-400">{dashboardData.methodology}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setLoggedIn(false);
                  setEmail("");
                  setPassword("");
                  setAccessToken("");
                  setDashboardData(null);
                  setDashboardError("");
                }}
                className="mt-6 btn-hack rounded-lg px-6 py-3"
              >
                Logout
              </button>
            </div>

            {/* Hint System */}
            <div className="card-hack p-6 rounded-lg bg-yellow-500/5 border-yellow-500/30">
              <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                <span>💡</span> Stuck? Here are some hints:
              </h3>
              <details className="text-sm text-gray-400">
                <summary className="cursor-pointer hover:text-matrix mb-2">Hint 1: Understanding the Token</summary>
                <p className="pl-4 py-2 border-l-2 border-yellow-500/30">
                  The access token isn't just random characters. Try decoding it with common encoding schemes (Base64, hex, etc.). What structure does it have?
                </p>
              </details>
              <details className="text-sm text-gray-400 mt-2">
                <summary className="cursor-pointer hover:text-matrix mb-2">Hint 2: Hidden Clues</summary>
                <p className="pl-4 py-2 border-l-2 border-yellow-500/30">
                  Use Burp's Proxy to inspect response headers carefully. The server might be leaving breadcrumbs about what it expects.
                </p>
              </details>
              <details className="text-sm text-gray-400 mt-2">
                <summary className="cursor-pointer hover:text-matrix mb-2">Hint 3: Time is Key</summary>
                <p className="pl-4 py-2 border-l-2 border-yellow-500/30">
                  Something about the authentication seems time-sensitive. When was "Launch Week 1"? Check historical company events.
                </p>
              </details>
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

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Login Form - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <div className="card-hack p-8 rounded-lg sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-matrix" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">CTF Challenge</h1>
                  <p className="text-gray-500 text-sm">Analytics Dashboard</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-lg bg-matrix/10 border border-matrix/30">
                <p className="text-sm text-matrix font-semibold mb-2">🎯 Objective:</p>
                <p className="text-sm text-gray-300">
                  Gain access to the Executive Dashboard to retrieve the flag. You'll need creativity and all three Burp Suite techniques.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-terminal-alt border border-gray-700 rounded-lg text-white focus:border-matrix focus:outline-none"
                    placeholder="user@example.com"
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
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-hack-filled rounded-lg py-3 font-semibold disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Test Credentials:</p>
                <code className="text-xs text-matrix font-mono">analyst@acme.com / analytics2024</code>
              </div>

              {loginAttempts > 0 && (
                <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-400">
                    Login attempts: <span className="font-bold">{loginAttempts}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions - Takes up 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card-hack p-6 rounded-lg border-matrix/30 bg-matrix/5">
              <h2 className="text-2xl font-bold text-matrix mb-4 flex items-center gap-2">
                <Flag className="w-6 h-6" />
                The Launch Week Mystery
              </h2>
              <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
                <p>
                  Welcome to Acme Corp's Analytics Dashboard. During our <span className="text-matrix font-semibold">Launch Week 1</span>,
                  something strange happened with our authentication system...
                </p>
                <p>
                  Regular analysts can log in, but only executives can access the Executive Dashboard where
                  sensitive data is stored. The security team suspects there's a vulnerability in how the system
                  validates user permissions.
                </p>
                <p className="text-yellow-400 font-semibold">
                  Your mission: Find a way to escalate your privileges and capture the flag.
                </p>
              </div>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">🔍 What You'll Need:</h3>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded bg-matrix/20 border border-matrix/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-matrix text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Proxy Skills</p>
                    <p className="text-sm text-gray-400">
                      Intercept traffic and discover hidden information in headers, responses, and requests.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded bg-matrix/20 border border-matrix/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-matrix text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Repeater Mastery</p>
                    <p className="text-sm text-gray-400">
                      Manually craft and test modified requests to manipulate authentication tokens.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded bg-matrix/20 border border-matrix/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-matrix text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">Intruder Automation</p>
                    <p className="text-sm text-gray-400">
                      Brute-force or fuzz specific parameters to find the exact values needed for access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">💭 Strategic Hints:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>The token format might reveal its structure. Is it encrypted or just encoded?</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Pay attention to <span className="text-matrix font-mono">ALL</span> response headers, not just the body</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Launch Week 1 happened at a specific time. Could timing matter?</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Role names in companies usually follow patterns: admin, executive, manager, analyst...</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Unix timestamps are commonly used in authentication systems</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix">•</span>
                  <span>Sometimes the server tells you what it wants if you know where to look</span>
                </li>
              </ul>
            </div>

            <div className="card-hack p-6 rounded-lg border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold text-red-400 mb-3">🎯 Real-World Context:</h3>
              <p className="text-sm text-gray-400 mb-3">
                This challenge simulates a <span className="text-red-400 font-semibold">client-side token manipulation</span> vulnerability
                combined with <span className="text-red-400 font-semibold">insufficient server-side validation</span>.
              </p>
              <p className="text-sm text-gray-400">
                Similar vulnerabilities have been found in production systems where tokens contain user roles or permissions
                that can be decoded and modified. Always validate permissions server-side and use cryptographically signed tokens (like JWTs with proper signatures).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
