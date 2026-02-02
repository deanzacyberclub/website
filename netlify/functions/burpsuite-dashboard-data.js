export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing or invalid authorization header'
        }),
        { status: 401, headers }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Decode the base64 token
    let tokenData;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      tokenData = JSON.parse(decoded);
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid token format'
        }),
        { status: 401, headers }
      );
    }

    console.log('[CTF Dashboard] Access attempt:', tokenData);

    // The vulnerability: Check if role is "executive" AND timestamp is during Launch Week 1
    // Launch Week 1: Jan 1, 2024 00:00:00 UTC to Jan 8, 2024 00:00:00 UTC
    const LAUNCH_WEEK_START = 1704067200; // Jan 1, 2024 00:00:00 UTC
    const LAUNCH_WEEK_END = 1704672000;   // Jan 8, 2024 00:00:00 UTC

    const role = tokenData.role;
    const timestamp = tokenData.timestamp;

    // Provide different error messages to guide the player
    if (role !== 'executive') {
      // Hint: They need to change the role
      const responseHeaders = {
        ...headers,
        'X-Error-Type': 'insufficient-privileges',
        'X-Required-Role': 'executive',
        'X-Current-Role': role || 'unknown'
      };

      return new Response(
        JSON.stringify({
          success: false,
          message: `Access denied: User role '${role}' does not have executive privileges`
        }),
        { status: 403, headers: responseHeaders }
      );
    }

    if (!timestamp || timestamp < LAUNCH_WEEK_START || timestamp > LAUNCH_WEEK_END) {
      // Hint: They need to find the right timestamp
      const responseHeaders = {
        ...headers,
        'X-Error-Type': 'invalid-timewindow',
        'X-Hint': 'Token must be issued during Launch Week 1',
        'X-Launch-Event': 'Jan 1-7, 2024',
        'X-Timestamp-Validation': 'failed'
      };

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Access denied: Token must have been issued during Launch Week 1 (January 1-7, 2024)'
        }),
        { status: 403, headers: responseHeaders }
      );
    }

    // SUCCESS! They've figured it out
    const successHeaders = {
      ...headers,
      'X-Congratulations': 'You solved it!',
      'X-Technique-Used': 'Token manipulation + Timestamp fuzzing'
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome to the Executive Dashboard! You have successfully escalated your privileges.',
        flag: 'DACC{t1m3_tr4v3l_4uth_byp4ss_FTW}',
        methodology: 'You discovered the token was base64-encoded JSON, changed the role to "executive", and brute-forced the timestamp to fall within the Launch Week 1 window (Jan 1-7, 2024).',
        data: {
          executive_count: 12,
          revenue: '$4.2M',
          projects: ['Project Phoenix', 'Project Orion', 'Project Titan']
        }
      }),
      { status: 200, headers: successHeaders }
    );

  } catch (error) {
    console.error('[CTF Dashboard Data] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};
