import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Mail } from "@/lib/cyberIcon";

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
      const fetchPromise = fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      // Wait for the request to complete (or fail after network timeout)
      // This simulates waiting for the server to respond
      await fetchPromise.catch(() => {
        // Endpoint doesn't exist, but request was sent and interceptable
      });

      // Add a small delay to simulate server processing time
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Simulate server-side response (with vulnerability)
      if (!validUsernames.includes(username.toLowerCase())) {
        setError("User not found");
      } else if (username.toLowerCase() === "admin" && password === "admin123") {
        setLoggedIn(true);
      } else {
        setError("Invalid password");
        setAttempts(Math.max(0, attempts - 1));
      }
    } catch (err) {
      // Even if the fetch fails (endpoint doesn't exist),
      // the request was still sent and can be intercepted

      // Add a small delay to simulate server processing time
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Simulate server-side response (with vulnerability)
      if (!validUsernames.includes(username.toLowerCase())) {
        setError("User not found");
      } else if (username.toLowerCase() === "admin" && password === "admin123") {
        setLoggedIn(true);
      } else {
        setError("Invalid password");
        setAttempts(Math.max(0, attempts - 1));
      }
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

          <div className="card-hack p-8 rounded-lg text-center">
            <h1 className="text-3xl font-bold text-matrix mb-4">Inbox</h1>
            <p className="text-gray-400 mb-6">Welcome to Acme Corp Webmail</p>
            <div className="space-y-3">
              <div className="p-4 rounded bg-terminal-alt border border-gray-700 text-left">
                <p className="text-sm text-gray-400">
                  <span className="font-bold text-white">From:</span> HR Department
                </p>
                <p className="text-sm text-gray-400">
                  <span className="font-bold text-white">Subject:</span> Welcome to the system
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
                <Mail className="w-8 h-8 text-matrix" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Acme Webmail</h1>
                  <p className="text-gray-500 text-sm">Corporate Email System</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm font-semibold">{error}</p>
                  </div>
                )}

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
                  disabled={loading || attempts === 0}
                  className="w-full btn-hack-filled rounded-lg py-3 font-semibold disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Attempts remaining: <span className="text-matrix font-bold">{attempts}</span>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <div className="card-hack p-6 rounded-lg">
              <h2 className="text-xl font-bold text-matrix mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Demo 3: Username Enumeration
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                This login form reveals different error messages based on whether the username exists. This allows attackers to enumerate valid usernames.
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">What to Demonstrate:</h3>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">1.</span>
                  <span>First, manually test with username "bob" and any password - see "User not found"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">2.</span>
                  <span>Try username "admin" with wrong password - see "Invalid password" (different!)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">3.</span>
                  <span>In Burp Suite, send a login request to <span className="text-matrix font-mono">Intruder</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">4.</span>
                  <span>Set the username field as the <span className="text-matrix font-mono">§injection point§</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">5.</span>
                  <span>Load the wordlist (see below) into Intruder's payload list</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">6.</span>
                  <span>Run the attack in <span className="text-matrix font-mono">Sniper</span> mode</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">7.</span>
                  <span>Sort by <span className="text-matrix font-mono">response length</span> - valid usernames have different response size</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">8.</span>
                  <span>Once you have valid usernames, password spraying becomes much easier!</span>
                </li>
              </ol>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">Test Wordlist:</h3>
              <div className="bg-terminal-alt border border-gray-700 rounded p-4">
                <pre className="text-xs text-matrix font-mono">
{`jsmith
admin
ceo
hradmin
bob
alice
test
guest
administrator
root`}
                </pre>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Valid usernames: jsmith, admin, ceo, hradmin
              </p>
              <p className="text-xs text-gray-400 mt-1">
                🔑 Working credentials: admin / admin123
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold text-red-400 mb-3">Real-World Impact:</h3>
              <p className="text-sm text-gray-400 mb-2">
                Attackers often enumerate valid usernames before attempting password attacks. Different error messages reveal whether an account exists.
              </p>
              <p className="text-sm text-gray-400">
                This vulnerability has affected GitHub, Facebook, and countless other sites. Always return generic error messages like "Invalid username or password".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo3;
