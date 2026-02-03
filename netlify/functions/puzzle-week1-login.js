// Valid usernames for enumeration
const validUsernames = [
  "jmitchell",
  "schen",
  "mtorres",
  "ewatson",
  "dpark",
  "jadams",
  "rkim",
  "lmorgan",
  "sysadmin",
  "service"
];

// The access code needed for admin login (found via IDOR in employee 1007)
const REQUIRED_ACCESS_CODE = "N3XU5-7R41N-2026";

// Admin credentials
const ADMIN_USERNAME = "sysadmin";
const ADMIN_PASSWORD = "nexus2026";

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
    const username = params.get('username')?.toLowerCase();
    const password = params.get('password');
    const accessCode = params.get('access_code'); // Hidden parameter - must be added via request tampering

    // Vulnerability #1: Username enumeration via different error messages
    if (!validUsernames.includes(username)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Account not found',
          _debug: 'Check /api/puzzle/week1/employees?id=1001 for valid employee records'
        }),
        { status: 404, headers }
      );
    }

    // Check if trying to login as admin
    if (username === ADMIN_USERNAME) {
      // Check password first
      if (password !== ADMIN_PASSWORD) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Incorrect password'
          }),
          { status: 401, headers }
        );
      }

      // Vulnerability #2: Need to tamper request to add access_code parameter
      if (!accessCode) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Security verification required'
          }),
          { status: 403, headers }
        );
      }

      if (accessCode !== REQUIRED_ACCESS_CODE) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid security code'
          }),
          { status: 403, headers }
        );
      }

      // SUCCESS - all three techniques used correctly
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Welcome to Nexus Systems, Administrator.',
          flag: 'DACC{burp_m4st3r_ch41n3d_3xpl01ts_w33k1}',
          methodology: 'Congratulations! You combined username enumeration, IDOR exploitation, and request tampering to gain admin access.'
        }),
        { status: 200, headers }
      );
    }

    // Regular user login (not admin) - password always "wrong" for non-admin
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Incorrect password'
      }),
      { status: 401, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
