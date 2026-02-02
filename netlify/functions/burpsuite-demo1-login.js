export default async (req, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Parse form data
    const body = await req.text();
    const params = new URLSearchParams(body);
    const password = params.get('password');
    const username = params.get('username');

    console.log(`[Demo 1] Login attempt - Username: ${username}`);

    // Check if password is correct
    if (password === '12345678') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          sessionId: 'abc123-fake-session-token-xyz789'
        }),
        { status: 200, headers }
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
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
