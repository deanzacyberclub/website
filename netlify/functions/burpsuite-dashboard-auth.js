export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

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
    const body = await req.text();
    const params = new URLSearchParams(body);
    const email = params.get('email');
    const password = params.get('password');

    console.log(`[CTF Dashboard] Login attempt - Email: ${email}`);

    // Valid test credentials
    if (email === 'analyst@acme.com' && password === 'analytics2024') {
      // Create a token that contains:
      // { role: "analyst", timestamp: <current_time>, userid: "analyst001" }
      // Encoded in Base64
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenData = {
        role: "analyst",
        timestamp: currentTime,
        userid: "analyst001"
      };

      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      // Add debugging headers that reveal hints (visible in Burp Proxy)
      const responseHeaders = {
        ...headers,
        'X-Token-Format': 'base64',
        'X-Token-Structure': 'json',
        'X-Auth-Hint': 'Token contains role, timestamp, and userid',
        'X-Launch-Week-Start': '1704067200',  // Jan 1, 2024 00:00:00 UTC
        'X-Launch-Week-End': '1704672000',    // Jan 8, 2024 00:00:00 UTC
        'X-Debug-Mode': 'enabled'
      };

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          access_token: token
        }),
        { status: 200, headers: responseHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid credentials'
        }),
        { status: 401, headers }
      );
    }
  } catch (error) {
    console.error('[CTF Dashboard Auth] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
