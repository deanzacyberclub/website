// The Hive - MFA Status Check API
// Returns the current MFA status for a user
// This is called by the frontend after login to verify MFA state

// In-memory store for MFA states (shared across this function's invocations)
// In a real app, this would be a database
// For the demo, we use a simple approach: MFA is disabled if we see a valid bypass token

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-UUID, X-Bypass-Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const uuid = req.headers.get('X-User-UUID');
    const bypassToken = req.headers.get('X-Bypass-Token');

    if (!uuid) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing X-User-UUID header' }),
        { status: 400, headers }
      );
    }

    // Default MFA states
    const defaultMfaStates = {
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890": false, // badActor123 - no MFA
      "f9e8d7c6-b5a4-3210-fedc-ba0987654321": true,  // StanleyYelnats - MFA enabled
    };

    let mfaEnabled = defaultMfaStates[uuid];

    if (mfaEnabled === undefined) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unknown UUID' }),
        { status: 404, headers }
      );
    }

    // Check if there's a valid bypass token that disables MFA
    if (bypassToken) {
      try {
        const decoded = Buffer.from(bypassToken, 'base64').toString();
        const [prefix, tokenUuid] = decoded.split(':');
        if (prefix === 'bypass' && tokenUuid === uuid) {
          mfaEnabled = false;
        }
      } catch {
        // Invalid token, ignore
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        uuid: uuid,
        mfaEnabled: mfaEnabled,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[Hive MFA Status] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
