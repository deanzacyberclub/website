import { useState } from "react";
import { Link } from "react-router-dom";

// User UUIDs - the vulnerability is that these can be discovered and swapped
const userUUIDs: Record<string, string> = {
  badActor123: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  StanleyYelnats: "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
};

// User accounts for the demo
interface User {
  username: string;
  password: string;
  displayName: string;
  avatar: string;
  mfaEnabled: boolean;
  bio: string;
  uuid: string;
}

const users: Record<string, User> = {
  badActor123: {
    username: "badActor123",
    password: "test!123",
    displayName: "Bad Actor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=badactor",
    mfaEnabled: false,
    bio: "Just testing things out...",
    uuid: userUUIDs.badActor123,
  },
  StanleyYelnats: {
    username: "StanleyYelnats",
    password: "secure!123",
    displayName: "Stanley Yelnats",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=stanley",
    mfaEnabled: true,
    bio: "Digging holes and finding treasure",
    uuid: userUUIDs.StanleyYelnats,
  },
};

function Demo4() {
  const [currentView, setCurrentView] = useState<"login" | "mfa" | "feed" | "settings" | "success">("login");
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showFlag, setShowFlag] = useState(false);
  const [mfaToggleLoading, setMfaToggleLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<Record<string, boolean>>({
    [userUUIDs.badActor123]: false,
    [userUUIDs.StanleyYelnats]: true,
  });

  // Store bypass tokens received from toggle responses
  // Initialize from localStorage to persist across page navigations
  const [bypassTokens, setBypassTokens] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('hive_bypass_tokens');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save bypass tokens to localStorage whenever they change
  const updateBypassTokens = (newTokens: Record<string, string>) => {
    setBypassTokens(newTokens);
    try {
      localStorage.setItem('hive_bypass_tokens', JSON.stringify(newTokens));
    } catch {
      // localStorage not available
    }
  };

  // Login makes an API call that returns the user's UUID in response headers
  // This is the vulnerability - the UUID is leaked BEFORE MFA verification
  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");

    try {
      // Check if we have a bypass token for this user
      const targetUser = users[loginForm.username];
      const bypassToken = targetUser ? bypassTokens[targetUser.uuid] : undefined;

      // Build headers - include bypass token if available
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (bypassToken) {
        requestHeaders["X-Bypass-Token"] = bypassToken;
      }

      // Make a real API call - the response headers will contain X-User-UUID
      // Visible in Burp Suite even before MFA is completed
      const response = await fetch("/api/hive/login", {
        method: "POST",
        headers: requestHeaders,
        credentials: "include", // Include cookies
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setLoginError(data.message || "Invalid username or password");
        setLoginLoading(false);
        return;
      }

      // Get user from local data for UI state
      const user = targetUser;
      if (!user) {
        setLoginError("User not found");
        setLoginLoading(false);
        return;
      }

      setLoggedInUser(user);

      // Use the mfaRequired from the API response
      // The server reads the cookie to determine if MFA was disabled
      const isMfaRequired = data.user?.mfaRequired ?? user.mfaEnabled;

      // Update local state to match
      setMfaStatus(prev => ({
        ...prev,
        [user.uuid]: isMfaRequired
      }));

      if (isMfaRequired) {
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
    } catch {
      // If API fails, fall back to client-side validation
      const user = users[loginForm.username];
      if (!user || user.password !== loginForm.password) {
        setLoginError("Invalid username or password");
        setLoginLoading(false);
        return;
      }

      setLoggedInUser(user);

      if (mfaStatus[user.uuid]) {
        setCurrentView("mfa");
        setGeneratedCode(null);
        setMfaCode("");
      } else {
        if (loginForm.username === "StanleyYelnats") {
          setShowFlag(true);
          setCurrentView("success");
        } else {
          setCurrentView("feed");
        }
      }
    }

    setLoginLoading(false);
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
    setGeneratedCode(null);
    setMfaCode("");
    setShowFlag(false);
  };

  const handleReset = () => {
    // Clear the MFA cookies by setting them to expire
    document.cookie = `mfa_disabled_${userUUIDs.StanleyYelnats.replace(/-/g, '')}=; Path=/; Max-Age=0`;
    document.cookie = `mfa_disabled_${userUUIDs.badActor123.replace(/-/g, '')}=; Path=/; Max-Age=0`;
    // Clear stored bypass tokens
    localStorage.removeItem('hive_bypass_tokens');
    setBypassTokens({});
    setMfaStatus({
      [userUUIDs.badActor123]: false,
      [userUUIDs.StanleyYelnats]: true,
    });
    handleLogout();
  };

  // API call for toggling MFA - makes a real fetch request for Burp Suite visibility
  // The vulnerability: The X-Auth-Token contains the user's UUID (base64 encoded)
  // Attacker needs to decode it, swap the UUID, re-encode, and replay
  const handleToggleMfa = async () => {
    if (!loggedInUser) return;

    setMfaToggleLoading(true);

    const newMfaState = !mfaStatus[loggedInUser.uuid];

    try {
      // Create auth token with embedded UUID - this is what the attacker needs to decode and modify
      // Format: username:uuid:timestamp (base64 encoded)
      const authTokenData = `${loggedInUser.username}:${loggedInUser.uuid}:${Date.now()}`;
      const authToken = btoa(authTokenData);

      // Make a real fetch request that Burp Suite can intercept
      // The vulnerability: X-Auth-Token contains the UUID - decode with Burp Decoder to find it
      const response = await fetch("/api/hive/mfa/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": authToken, // VULNERABLE: Contains UUID, decode with Burp Decoder
        },
        credentials: "include", // Include cookies so Set-Cookie works
        body: JSON.stringify({
          action: newMfaState ? "enable" : "disable"
        }),
      });

      const data = await response.json();
      if (data.success && data.uuid) {
        // Update MFA status
        setMfaStatus(prev => ({
          ...prev,
          [data.uuid]: data.mfaEnabled
        }));

        // If MFA was disabled and we got a bypass token, store it
        // This token can be used to bypass MFA on login
        if (data.bypassToken && !data.mfaEnabled) {
          updateBypassTokens({
            ...bypassTokens,
            [data.uuid]: data.bypassToken
          });
        } else if (data.mfaEnabled) {
          // If MFA was re-enabled, remove any stored bypass token
          const newTokens = { ...bypassTokens };
          delete newTokens[data.uuid];
          updateBypassTokens(newTokens);
        }
      } else {
        setMfaStatus(prev => ({
          ...prev,
          [loggedInUser.uuid]: newMfaState
        }));
      }

    } catch {
      setMfaStatus(prev => ({
        ...prev,
        [loggedInUser.uuid]: newMfaState
      }));
    }

    setMfaToggleLoading(false);
  };

  // Decoy settings that don't work
  const decoySettings = [
    { name: "Profile Visibility", value: "Public" },
    { name: "Email Notifications", value: "Enabled" },
    { name: "Dark Mode", value: "Disabled" },
    { name: "Language", value: "English" },
  ];

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
              disabled={loginLoading}
              className={`w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors ${loginLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loginLoading ? "Signing In..." : "Sign In"}
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

              {loggedInUser?.username === "StanleyYelnats" ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-red-700">
                    <span className="font-semibold">Authentication device not available.</span>
                    <br />
                    Contact support if you've lost access to your authenticator.
                  </p>
                </div>
              ) : (
                <>
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
                </>
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
                FLAG{"{"}MFA_BYPASS_DECODER_IDOR{"}"}
              </code>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
              <p className="font-semibold text-blue-900 mb-2">Methodology:</p>
              <ol className="text-sm text-blue-800 space-y-2">
                <li>1. Logged in as badActor123 (no MFA)</li>
                <li>2. Toggled MFA and intercepted the request in Burp Suite</li>
                <li>3. Found X-Auth-Token header with base64 encoded data</li>
                <li>4. Used Burp Decoder to decode: <code className="bg-blue-100 px-1">username:uuid:timestamp</code></li>
                <li>5. Changed the UUID to StanleyYelnats' UUID: <code className="bg-blue-100 px-1">f9e8d7c6-b5a4-3210-fedc-ba0987654321</code></li>
                <li>6. Re-encoded with base64 and replayed the request</li>
                <li>7. Logged in as StanleyYelnats - MFA bypassed!</li>
              </ol>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6">
              <p className="font-semibold text-red-900 mb-2">Vulnerability:</p>
              <p className="text-sm text-red-800">
                <strong>Broken Access Control (IDOR via Encoded Token)</strong> - The /api/hive/mfa/toggle endpoint extracts the user UUID from the X-Auth-Token header without validating ownership. By decoding the base64 token, modifying the UUID, and re-encoding, an attacker can modify any user's MFA settings.
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
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
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
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className="text-gray-700 font-medium">Multi-Factor Authentication</span>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={handleToggleMfa}
                    disabled={mfaToggleLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mfaStatus[loggedInUser!.uuid]
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    } ${mfaToggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {mfaToggleLoading ? "..." : mfaStatus[loggedInUser!.uuid] ? "Disable MFA" : "Enable MFA"}
                  </button>
                </div>
              </div>
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

export default Demo4;
