// The Hive - MFA Reset API
// Resets MFA status to defaults (for demo purposes)

// This endpoint is called when the demo page loads to reset state

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

  // Just return success - the actual reset happens because each function
  // instance starts fresh with default values
  return new Response(
    JSON.stringify({
      success: true,
      message: 'MFA status reset to defaults',
    }),
    { status: 200, headers }
  );
};
