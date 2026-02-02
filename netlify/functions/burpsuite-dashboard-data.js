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

    // Parse the JSON token (no encoding)
    let tokenData;
    try {
      tokenData = JSON.parse(token);
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

    // The vulnerability: Check if role is in the correct privilege level AND timestamp is during Launch Week 1
    // Launch Week 1: Jan 1, 2024 00:00:00 UTC to Jan 8, 2024 00:00:00 UTC
    const LAUNCH_WEEK_START = 1704067200; // Jan 1, 2024 00:00:00 UTC
    const LAUNCH_WEEK_END = 1704672000;   // Jan 8, 2024 00:00:00 UTC

    // List of valid roles (from lowest to highest privilege)
    const validRoles = [
      'intern',
      'employee',
      'analyst',
      'senior-analyst',
      'team-lead',
      'manager',
      'senior-manager',
      'director',
      'senior-director',
      'vp',
      'senior-vp',
      'executive-vp',
      'c-level',
      'cfo',
      'cto',
      'coo',
      'ceo'
    ];

    const role = tokenData.role;
    const timestamp = tokenData.timestamp;

    // The correct role is "c-level" (Chief-level access)
    // Provide different error messages to guide the player
    if (role !== 'c-level') {
      // Hint: They need to find the right role
      const responseHeaders = {
        ...headers,
        'X-Error-Type': 'insufficient-privileges',
        'X-Current-Role': role || 'unknown',
        'X-Role-Hierarchy': 'System uses standard corporate role hierarchy'
      };

      return new Response(
        JSON.stringify({
          success: false,
          message: `Access denied: Role '${role}' does not have sufficient privileges for executive dashboard`
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
      'X-Technique-Used': 'Token manipulation + Role enumeration + Timestamp fuzzing'
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome to the Executive Dashboard! You have successfully escalated your privileges.',
        flag: 'Week 1 - Bear',
        methodology: 'You modified the token role field using Repeater, brute-forced the correct role (c-level) using Intruder, and set the timestamp to fall within Launch Week 1 (Jan 1-7, 2024).',
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
