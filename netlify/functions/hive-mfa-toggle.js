// The Hive - MFA Toggle API
// Vulnerable to IDOR via X-User-UUID header manipulation

// Known user UUIDs (must match Demo5.tsx)
const validUUIDs = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "badActor123",
  "f9e8d7c6-b5a4-3210-fedc-ba0987654321": "StanleyYelnats",
};

// In-memory MFA status (resets on function cold start, which is fine for demo)
// This won't persist across requests, but the demo handles state on the frontend
const mfaStatus = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": false, // badActor123 - MFA disabled
  "f9e8d7c6-b5a4-3210-fedc-ba0987654321": true,  // StanleyYelnats - MFA enabled
};

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-UUID',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // Get the UUID from the header - THIS IS THE VULNERABILITY
    // The server trusts the X-User-UUID header without validating ownership
    const targetUUID = req.headers.get('X-User-UUID');
    const authToken = req.headers.get('X-Auth-Token');

    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers }
      );
    }

    if (!targetUUID) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing X-User-UUID header' }),
        { status: 400, headers }
      );
    }

    // Check if UUID is valid
    if (!validUUIDs[targetUUID]) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid UUID' }),
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

    // VULNERABILITY: We don't verify that the authenticated user owns this UUID
    // Any authenticated user can toggle MFA for any UUID
    const newMfaState = action === 'enable';
    const username = validUUIDs[targetUUID];

    // Return success with info about what was changed
    // In a real app, this would persist to a database
    return new Response(
      JSON.stringify({
        success: true,
        message: `MFA ${action}d successfully`,
        uuid: targetUUID,
        username: username,
        mfaEnabled: newMfaState,
      }),
      {
        status: 200,
        headers: {
          ...headers,
          'X-MFA-Status': newMfaState ? 'enabled' : 'disabled',
          'X-Target-UUID': targetUUID,
          'X-Target-User': username,
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
