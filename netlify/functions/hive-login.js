// The Hive - Login API
// Returns user UUID in response headers (VULNERABILITY: leaks UUID before MFA verification)

// User credentials and UUIDs (must match Demo5.tsx)
const users = {
  badActor123: {
    password: "test!123",
    uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    displayName: "Bad Actor",
    defaultMfaEnabled: false,
  },
  StanleyYelnats: {
    password: "secure!123",
    uuid: "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
    displayName: "Stanley Yelnats",
    defaultMfaEnabled: true,
  },
};

// Parse cookies from request
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
}

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid JSON body' }),
        { status: 400, headers }
      );
    }

    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Username and password required' }),
        { status: 400, headers }
      );
    }

    const user = users[username];

    if (!user || user.password !== password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid username or password' }),
        { status: 401, headers }
      );
    }

    // Check if MFA was disabled via cookie (set by toggle endpoint)
    const cookies = parseCookies(req.headers.get('Cookie'));
    const cookieName = `mfa_disabled_${user.uuid.replace(/-/g, '')}`;
    const mfaDisabledByCookie = cookies[cookieName] === '1';

    const isMfaEnabled = mfaDisabledByCookie ? false : user.defaultMfaEnabled;

    // VULNERABILITY: We return the user's UUID in the response headers
    // This leaks the UUID BEFORE MFA verification
    const responseHeaders = {
      ...headers,
      'X-Session-Token': Buffer.from(`${username}:session:${Date.now()}`).toString('base64'),
      'X-User-UUID': user.uuid, // LEAKED! Attacker can use this
      'X-MFA-Required': isMfaEnabled ? 'true' : 'false',
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: isMfaEnabled ? 'MFA verification required' : 'Login successful',
        user: {
          username: username,
          displayName: user.displayName,
          mfaRequired: isMfaEnabled,
        },
      }),
      { status: 200, headers: responseHeaders }
    );

  } catch (error) {
    console.error('[Hive Login] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
