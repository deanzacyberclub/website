import { useState } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardError, setDashboardError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Acme Corp</h1>
                  <p className="text-xs text-gray-500">Analytics Platform</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setLoggedIn(false);
                  setEmail("");
                  setPassword("");
                  setAccessToken("");
                  setDashboardData(null);
                  setDashboardError("");
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome, {email}</h2>
            <p className="text-gray-600 mb-4">You are logged into the Acme Analytics Platform</p>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Access Token:</span>
              </p>
              <code className="text-xs text-gray-800 break-all font-mono">{accessToken}</code>
            </div>

            <button
              onClick={handleAccessDashboard}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Loading..." : "View Executive Dashboard"}
            </button>
          </div>

          {/* Error Message */}
          {dashboardError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Access Denied</h3>
                  <p className="text-red-800 text-sm mb-2">{dashboardError}</p>
                  <p className="text-red-700 text-xs">
                    You don't have the required permissions to access the executive dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message with Flag */}
          {dashboardData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-xl font-semibold text-green-900">Access Granted!</h3>
                  <p className="text-green-800 text-sm mt-1">{dashboardData.message}</p>
                </div>
              </div>

              <div className="bg-white border border-green-300 rounded p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">🚩 FLAG:</p>
                <code className="text-lg text-green-700 font-mono font-bold break-all">
                  {dashboardData.flag}
                </code>
              </div>

              {dashboardData.methodology && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Solution Methodology:</p>
                  <p className="text-xs text-blue-800">{dashboardData.methodology}</p>
                </div>
              )}
            </div>
          )}

          {/* Back Link */}
          <Link
            to="/burpsuite"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Burp Suite Demos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Acme Corp</h1>
              <p className="text-sm text-gray-500">Analytics Platform</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Test Credentials:</p>
            <code className="text-xs text-gray-800 font-mono">analyst@acme.com / analytics2024</code>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">© 2024 Acme Corp. All rights reserved.</p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link
            to="/burpsuite"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Burp Suite Demos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
