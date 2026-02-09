// The Hive - MFA Toggle API
// Vulnerable to IDOR via base64 encoded X-Auth-Token manipulation
// User must decode the token with Burp Decoder to find the UUID

// Known user UUIDs (must match Demo4.tsx)
const validUUIDs = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "badActor123",
  "f9e8d7c6-b5a4-3210-fedc-ba0987654321": "StanleyYelnats",
};

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'X-MFA-Status, X-Target-UUID, X-Target-User, X-Bypass-Token',
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
    // Get the auth token from header - THIS IS THE VULNERABILITY
    // Token format (base64): username:uuid:timestamp
    // Attacker needs to decode it, change the UUID, and re-encode
    const authToken = req.headers.get('X-Auth-Token');

    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers }
      );
    }

    // Decode the auth token to extract the UUID
    let targetUUID;
    let tokenUsername;
    try {
      const decoded = Buffer.from(authToken, 'base64').toString();
      const parts = decoded.split(':');
      if (parts.length < 2) {
        throw new Error('Invalid token format');
      }
      tokenUsername = parts[0];
      targetUUID = parts[1]; // UUID is the second part
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid authentication token' }),
        { status: 401, headers }
      );
    }

    // Check if UUID is valid
    if (!validUUIDs[targetUUID]) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid UUID in token' }),
        { status: 404, headers }
      );
    }

    // Parse the body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid JSON body' }),
        { status: 400, headers }
      );
    }

    const { action } = body;

    if (action !== 'enable' && action !== 'disable') {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid action. Use "enable" or "disable"' }),
        { status: 400, headers }
      );
    }

    // VULNERABILITY: We use the UUID from the token without verifying ownership
    // The authenticated user (tokenUsername) might not own this UUID
    const newMfaState = action === 'enable';
    const username = validUUIDs[targetUUID];

    // Return success with info about what was changed
    // The bypass token can be used on the login page to skip MFA
    const bypassToken = !newMfaState ? Buffer.from(`bypass:${targetUUID}:${Date.now()}`).toString('base64') : null;

    return new Response(
      JSON.stringify({
        success: true,
        message: `MFA ${action}d successfully`,
        uuid: targetUUID,
        username: username,
        mfaEnabled: newMfaState,
        bypassToken: bypassToken,
      }),
      {
        status: 200,
        headers: {
          ...headers,
          'X-MFA-Status': newMfaState ? 'enabled' : 'disabled',
          'X-Target-UUID': targetUUID,
          'X-Target-User': username,
          'X-Bypass-Token': bypassToken || '',
        }
      }
    );

  } catch (error) {
    console.error('[Hive MFA Toggle] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
