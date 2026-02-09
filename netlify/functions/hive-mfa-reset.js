// The Hive - MFA Reset API
// Resets MFA status to defaults (for demo purposes)
import { getStore } from "@netlify/blobs";

// Default MFA status
const defaultMfaStatus = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": false, // badActor123 - MFA disabled
  "f9e8d7c6-b5a4-3210-fedc-ba0987654321": true,  // StanleyYelnats - MFA enabled
};

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // Reset MFA status to defaults in Netlify Blobs
    const store = getStore("hive-mfa");
    await store.setJSON("mfa-status", defaultMfaStatus);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'MFA status reset to defaults',
        mfaStatus: defaultMfaStatus,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[Hive MFA Reset] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
