import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle } from "@/lib/cyberIcon";

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
      const fetchPromise = fetch("/api/burpsuite/demo1/login", {
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
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Simulate server-side validation
      // In a real scenario, the server would check this
      if (password === "12345678") {
        // Set a fake session cookie
        document.cookie = "SESSIONID=abc123-fake-session-token-xyz789; path=/";
        setLoading(false);
        setLoggedIn(true);
      } else {
        setLoading(false);
        alert("Authentication failed. Invalid credentials.");
      }
    } catch (err) {
      // Even if the fetch fails (endpoint doesn't exist),
      // the request was still sent and can be intercepted

      // Add a small delay to simulate server processing time
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Simulate server-side validation
      if (password === "12345678") {
        // Set a fake session cookie
        document.cookie = "SESSIONID=abc123-fake-session-token-xyz789; path=/";
        setLoading(false);
        setLoggedIn(true);
      } else {
        setLoading(false);
        alert("Authentication failed. Invalid credentials.");
      }
    }
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
            <h1 className="text-3xl font-bold text-matrix mb-4">
              Welcome back, {username}!
            </h1>
            <p className="text-gray-400 mb-6">
              You have successfully logged into the Acme Corp Employee Portal.
            </p>
            <div className="p-4 rounded-lg bg-matrix/10 border border-matrix/30">
              <p className="text-sm text-gray-400">
                <span className="text-matrix font-bold">Session Token:</span> abc123-fake-session-token-xyz789
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

        <div className="grid md:grid-cols-2 gap-8">
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
                  <h1 className="text-2xl font-bold text-white">Acme Corp</h1>
                  <p className="text-gray-500 text-sm">Employee Portal</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-matrix focus:ring-matrix"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
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

              <p className="text-center text-gray-500 text-xs mt-4">
                Version 2.3.1 | Web Client
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <div className="card-hack p-6 rounded-lg">
              <h2 className="text-xl font-bold text-matrix mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Demo 1: Proxy Intercept
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                This login form transmits credentials in plain text. Use Burp Suite to intercept and analyze the request.
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">What to Demonstrate:</h3>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">1.</span>
                  <span>Open Burp Suite and turn on <span className="text-matrix font-mono">Intercept</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">2.</span>
                  <span>Enter any username and password (try "wrongpass") in the form</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">3.</span>
                  <span>Click "Sign In" and view the intercepted request</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">4.</span>
                  <span>Show the password visible in <span className="text-matrix font-mono">plain text</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">5.</span>
                  <span>Point out hidden fields: <span className="text-matrix font-mono">app_version</span> and <span className="text-matrix font-mono">client_type</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">6.</span>
                  <span><span className="text-red-400 font-bold">Modify the password</span> in Burp to <span className="text-matrix font-mono">12345678</span> before forwarding</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">7.</span>
                  <span>Forward the request - the login succeeds! This demonstrates request tampering</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">8.</span>
                  <span>Observe the session cookie being set in the response</span>
                </li>
              </ol>
            </div>

            <div className="card-hack p-6 rounded-lg bg-blue-500/5 border-blue-500/30">
              <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Demo Tip:</h3>
              <p className="text-sm text-gray-400">
                The backend only accepts password <span className="text-matrix font-mono font-bold">12345678</span>.
                This allows you to demonstrate request modification by intercepting any login attempt and changing the password to the correct value in Burp Suite.
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold text-red-400 mb-3">Real-World Impact:</h3>
              <p className="text-sm text-gray-400">
                Many internal corporate apps and legacy systems still transmit credentials in easily viewable form. Even over HTTPS, anyone with network access or a compromised proxy can see everything.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo1;
