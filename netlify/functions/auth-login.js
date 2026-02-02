const validUsernames = ["jsmith", "admin", "ceo", "hradmin"];

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
    const username = params.get('username');
    const password = params.get('password');

    console.log(`[Demo 3] Login attempt - Username: ${username}`);

    if (!validUsernames.includes(username.toLowerCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User not found'
        }),
        { status: 404, headers }
      );
    } else if (username.toLowerCase() === 'admin' && password === 'admin123') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful'
        }),
        { status: 200, headers }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid password'
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
