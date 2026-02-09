import { useState } from "react";
import { Link } from "react-router-dom";

// User accounts for the demo
interface User {
  username: string;
  password: string;
  displayName: string;
  avatar: string;
  mfaEnabled: boolean;
  bio: string;
}

const users: Record<string, User> = {
  badActor123: {
    username: "badActor123",
    password: "test!123",
    displayName: "Bad Actor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=badactor",
    mfaEnabled: false,
    bio: "Just testing things out...",
  },
  StanleyYelnats: {
    username: "StanleyYelnats",
    password: "secure!123",
    displayName: "Stanley Yelnats",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=stanley",
    mfaEnabled: true,
    bio: "Digging holes and finding treasure",
  },
};

// Track MFA status separately so it can be modified via API
let mfaStatus: Record<string, boolean> = {
  badActor123: false,
  StanleyYelnats: true,
};

// Reset MFA status
const resetMfaStatus = () => {
  mfaStatus = {
    badActor123: false,
    StanleyYelnats: true,
  };
};

function Demo5() {
  const [currentView, setCurrentView] = useState<"login" | "mfa" | "feed" | "settings" | "success">("login");
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [showFlag, setShowFlag] = useState(false);

  const handleLogin = () => {
    const user = users[loginForm.username];
    if (!user || user.password !== loginForm.password) {
      setLoginError("Invalid username or password");
      return;
    }

    setLoggedInUser(user);
    setLoginError("");

    // Check if MFA is enabled for this user
    if (mfaStatus[loginForm.username]) {
      setCurrentView("mfa");
      setGeneratedCode(null);
      setMfaCode("");
    } else {
      // If logging in as Stanley after disabling MFA, show success
      if (loginForm.username === "StanleyYelnats") {
        setShowFlag(true);
        setCurrentView("success");
      } else {
        setCurrentView("feed");
      }
    }
  };

  const handleGenerateMfaCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
  };

  const handleVerifyMfa = () => {
    if (!generatedCode) {
      setMfaError("Please generate a code first");
      return;
    }
    if (mfaCode !== generatedCode) {
      setMfaError("Invalid code. Try again.");
      return;
    }
    setMfaError("");
    setCurrentView("feed");
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentView("login");
    setLoginForm({ username: "", password: "" });
    setApiResponse(null);
    setGeneratedCode(null);
    setMfaCode("");
    setShowFlag(false);
  };

  const handleReset = () => {
    resetMfaStatus();
    handleLogout();
  };

  // Simulated API call for toggling MFA
  const handleToggleMfa = async (targetUser: string, enable: boolean) => {
    // This is the vulnerable endpoint - only checks if user is logged in, not if they own the account
    if (!loggedInUser) {
      setApiResponse(JSON.stringify({ success: false, error: "Not authenticated" }, null, 2));
      return;
    }

    // Simulate API call
    const requestBody = {
      target_user: targetUser,
      mfa_enabled: enable,
    };

    // Base64 encode the request for Burp Suite visibility
    const encodedRequest = btoa(JSON.stringify(requestBody));

    // The vulnerability: no authorization check - any logged in user can modify any user's MFA
    mfaStatus[targetUser] = enable;

    setApiResponse(JSON.stringify({
      success: true,
      request_payload: encodedRequest,
      decoded_payload: requestBody,
      message: `MFA ${enable ? "enabled" : "disabled"} for user: ${targetUser}`,
      hint: targetUser !== loggedInUser.username
        ? "Interesting... you modified another user's MFA settings!"
        : undefined
    }, null, 2));
  };

  // Decoy settings that don't work
  const decoySettings = [
    { name: "Profile Visibility", value: "Public" },
    { name: "Email Notifications", value: "Enabled" },
    { name: "Dark Mode", value: "Disabled" },
    { name: "Language", value: "English" },
  ];

  const handleDecoyClick = (setting: string) => {
    setApiResponse(JSON.stringify({
      success: false,
      error: "This setting is not relevant to the challenge. Look for security-related settings...",
      hint: "Try examining the MFA toggle endpoint more closely",
    }, null, 2));
  };

  // Login Screen
  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* Sticky Note */}
        <div
          className="absolute top-8 left-8 w-64 p-4 bg-yellow-200 shadow-lg transform -rotate-2 z-10"
          style={{
            boxShadow: "3px 3px 10px rgba(0,0,0,0.2)",
            fontFamily: "'Patrick Hand', cursive, sans-serif"
          }}
        >
          <div className="text-gray-800 text-sm">
            <p className="font-bold text-base mb-3 border-b border-yellow-400 pb-2">Test Credentials</p>
            <div className="mb-3">
              <p className="font-semibold text-amber-700">Test User:</p>
              <p>user: <span className="font-mono bg-yellow-100 px-1">badActor123</span></p>
              <p>pass: <span className="font-mono bg-yellow-100 px-1">test!123</span></p>
            </div>
            <div>
              <p className="font-semibold text-red-700">Compromised User:</p>
              <p>user: <span className="font-mono bg-yellow-100 px-1">StanleyYelnats</span></p>
              <p>pass: <span className="font-mono bg-yellow-100 px-1">secure!123</span></p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src="/hive.png" alt="The Hive" className="w-16 h-16 mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">The Hive</h1>
            <p className="text-gray-500 text-sm">Connect with your swarm</p>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                placeholder="Enter your password"
              />
            </div>

            {loginError && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Sign In
            </button>
          </div>

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

  // MFA Screen
  if (currentView === "mfa") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <img src="/hive.png" alt="The Hive" className="w-12 h-12 mb-2" />
            <h1 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h1>
          </div>

          {/* MFA Block */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">MFA is enabled</p>
                <p className="text-sm text-gray-600">for @{loggedInUser?.username}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4">
              This account has Multi-Factor Authentication enabled. Enter your authentication code to continue.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center text-2xl tracking-widest text-gray-900"
                placeholder="000000"
                maxLength={6}
              />

              <button
                onClick={handleGenerateMfaCode}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                Generate Auth Code (Simulated)
              </button>

              {generatedCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-700">Your code: <span className="font-mono font-bold text-lg">{generatedCode}</span></p>
                </div>
              )}

              {mfaError && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                  {mfaError}
                </div>
              )}

              <button
                onClick={handleVerifyMfa}
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Verify Code
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (currentView === "success" && showFlag) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">MFA Bypass Successful!</h2>
            <p className="text-gray-600 mb-6">You've successfully bypassed MFA and logged in as Stanley Yelnats!</p>

            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6">
              <p className="text-sm font-medium text-gray-600 mb-2">FLAG:</p>
              <code className="text-xl text-green-700 font-mono font-bold block">
                FLAG{"{"}MFA_BYPASS_IDOR_AUTH_VULN{"}"}
              </code>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
              <p className="font-semibold text-blue-900 mb-2">Methodology:</p>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Logged in as badActor123 (no MFA)</li>
                <li>2. Found the MFA toggle endpoint in Settings</li>
                <li>3. Noticed the endpoint only checks authentication, not authorization</li>
                <li>4. Modified the target_user parameter to "StanleyYelnats"</li>
                <li>5. Disabled MFA for StanleyYelnats via the vulnerable endpoint</li>
                <li>6. Logged in as StanleyYelnats - MFA bypassed!</li>
              </ol>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6">
              <p className="font-semibold text-red-900 mb-2">Vulnerability:</p>
              <p className="text-sm text-red-800">
                <strong>Broken Access Control (IDOR)</strong> - The /api/mfa/toggle endpoint validates that a user is logged in,
                but doesn't verify that the authenticated user has permission to modify the target user's MFA settings.
                Any authenticated user can disable MFA for any other user.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Reset & Try Again
            </button>

            <div className="mt-4">
              <Link
                to="/burpsuite"
                className="text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                ← Back to Burp Suite Demos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Feed/Settings View
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <img src="/hive.png" alt="The Hive" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">The Hive</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView("feed")}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentView === "feed" ? "bg-amber-100 text-amber-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setCurrentView("settings")}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentView === "settings" ? "bg-amber-100 text-amber-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Settings
              </button>
              <div className="flex items-center gap-2 ml-4">
                <img
                  src={loggedInUser?.avatar}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-gray-900">@{loggedInUser?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {currentView === "feed" && (
          <>
            {/* User Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={loggedInUser?.avatar}
                  alt="Your profile"
                  className="w-16 h-16 rounded-full border-2 border-amber-500"
                />
                <div>
                  <h2 className="font-bold text-gray-900">{loggedInUser?.displayName}</h2>
                  <p className="text-gray-500">@{loggedInUser?.username}</p>
                  <p className="text-sm text-gray-600 mt-1">{loggedInUser?.bio}</p>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Feed</h3>
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No posts yet</p>
                <p className="text-sm mt-2">Check out the Settings page to configure your account</p>
              </div>
            </div>
          </>
        )}

        {currentView === "settings" && (
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-4">
                {decoySettings.map((setting) => (
                  <div
                    key={setting.name}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 px-2 rounded"
                    onClick={() => handleDecoyClick(setting.name)}
                  >
                    <span className="text-gray-700">{setting.name}</span>
                    <span className="text-gray-500 text-sm">{setting.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Settings - THE VULNERABLE SECTION */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Security Settings</h3>

              <div className="space-y-4">
                {/* MFA Toggle for current user */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <span className="text-gray-700 font-medium">Multi-Factor Authentication</span>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => handleToggleMfa(loggedInUser!.username, !mfaStatus[loggedInUser!.username])}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mfaStatus[loggedInUser!.username]
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {mfaStatus[loggedInUser!.username] ? "Disable MFA" : "Enable MFA"}
                  </button>
                </div>

                {/* Hint about the endpoint */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-mono">
                    POST /api/mfa/toggle
                    <br />
                    Content-Type: application/json
                    <br />
                    X-Auth-User: {loggedInUser?.username}
                    <br />
                    Body: {"{"} target_user: string, mfa_enabled: boolean {"}"}
                  </p>
                </div>
              </div>
            </div>

            {/* API Response Display */}
            {apiResponse && (
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-gray-400 text-sm font-mono">API Response</span>
                </div>
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  {apiResponse}
                </pre>
              </div>
            )}

            {/* Hint Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                <strong>Hint:</strong> The MFA toggle endpoint seems to accept a target_user parameter.
                What happens if you try to toggle MFA for a different user? Try intercepting the request with Burp Suite...
              </p>
            </div>
          </div>
        )}

        {/* Back to demos link */}
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

export default Demo5;
