import http from 'http';
import { parse } from 'url';

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);

  // Demo 1: Login endpoint
  if (parsedUrl.pathname === '/api/burpsuite/demo1/login' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse form data
      const params = new URLSearchParams(body);
      const password = params.get('password');
      const username = params.get('username');

      console.log(`[Demo 1] Login attempt - Username: ${username}, Password: ${password}`);

      // Check if password is correct
      if (password === '12345678') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Login successful',
          sessionId: 'abc123-fake-session-token-xyz789'
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid credentials'
        }));
      }
    });
    return;
  }

  // Demo 2: Document endpoint
  if (parsedUrl.pathname === '/api/documents' && req.method === 'GET') {
    const documentId = parsedUrl.query.id;

    const documents = {
      "1001": {
        title: "Your Performance Review",
        content: "Employee: John Smith\\nRating: Meets Expectations\\nSalary: $75,000\\nReview Period: Q4 2025\\nManager Comments: Solid performer, shows up on time.",
        classification: "personal",
      },
      "1002": {
        title: "CEO Salary Information",
        content: "Employee: Jane Doe\\nPosition: Chief Executive Officer\\nBase Salary: $2,400,000\\nAnnual Bonus: $500,000\\nStock Options: 100,000 shares\\nPerks: Company car, executive housing",
        classification: "executive-confidential",
      },
      "1003": {
        title: "Upcoming Layoffs Plan",
        content: "Q3 2026 Restructuring Plan\\n\\nAction: Terminate 15% of engineering staff\\nDepartments affected: Backend, DevOps, QA\\nTimeline: August 2026\\n\\n⚠️ DO NOT DISCLOSE until official announcement\\nSeverance packages prepared\\nPR strategy in development",
        classification: "board-confidential",
      },
      "1004": {
        title: "Merger & Acquisition Plans",
        content: "CONFIDENTIAL - ATTORNEY-CLIENT PRIVILEGED\\n\\nAcquisition Target: TechStartup Inc.\\nProposed Price: $50,000,000\\nDue Diligence Status: In Progress\\nExpected Close: Q2 2026\\n\\n⚠️ Keep confidential until SEC filing\\nLegal team: Wilson & Associates\\nInvestment bank: Goldman Sachs",
        classification: "legal-confidential",
      },
    };

    console.log(`[Demo 2] Document request - ID: ${documentId}`);

    const doc = documents[documentId];
    if (doc) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(doc));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Document not found' }));
    }
    return;
  }

  // Demo 3: Username enumeration endpoint
  if (parsedUrl.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const params = new URLSearchParams(body);
      const username = params.get('username');
      const password = params.get('password');

      console.log(`[Demo 3] Login attempt - Username: ${username}, Password: ${password}`);

      const validUsernames = ["jsmith", "admin", "ceo", "hradmin"];

      if (!validUsernames.includes(username.toLowerCase())) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'User not found'
        }));
      } else if (username.toLowerCase() === 'admin' && password === 'admin123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Login successful'
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid password'
        }));
      }
    });
    return;
  }

  // Demo 4: Booking endpoint
  if (parsedUrl.pathname === '/api/booking' && req.method === 'GET') {
    const dataParam = parsedUrl.query.data;
    const refParam = parsedUrl.query.ref;

    console.log(`[Demo 4] Booking request - data: ${dataParam ? 'present' : 'none'}, ref: ${refParam ? 'present' : 'none'}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Booking data received'
    }));
    return;
  }

  // Puzzle Week 1: Employees endpoint (IDOR)
  if (parsedUrl.pathname === '/api/puzzle/week1/employees' && req.method === 'GET') {
    const employeeId = parsedUrl.query.id;

    const employees = {
      "1001": { id: "1001", name: "John Mitchell", department: "Sales", position: "Sales Associate", email: "j.mitchell@nexus-sys.internal", phone: "x4521", notes: "Standard employee access" },
      "1002": { id: "1002", name: "Sarah Chen", department: "Engineering", position: "Software Developer", email: "s.chen@nexus-sys.internal", phone: "x4102", notes: "Has repository access" },
      "1003": { id: "1003", name: "Michael Torres", department: "HR", position: "HR Coordinator", email: "m.torres@nexus-sys.internal", phone: "x4200", notes: "Employee records access" },
      "1004": { id: "1004", name: "Emily Watson", department: "Finance", position: "Financial Analyst", email: "e.watson@nexus-sys.internal", phone: "x4301", notes: "Budget system access" },
      "1005": { id: "1005", name: "David Park", department: "IT", position: "System Administrator", email: "d.park@nexus-sys.internal", phone: "x4050", notes: "Infrastructure access - Level 2", access_level: "elevated" },
      "1006": { id: "1006", name: "Jennifer Adams", department: "Marketing", position: "Marketing Manager", email: "j.adams@nexus-sys.internal", phone: "x4410", notes: "Campaign system access" },
      "1007": { id: "1007", name: "Robert Kim", department: "Security", position: "Security Engineer", email: "r.kim@nexus-sys.internal", phone: "x4001", notes: "RESTRICTED - Do not share access_code: N3XU5-7R41N-2026", access_level: "security", clearance: "Level 4" },
      "1008": { id: "1008", name: "Lisa Morgan", department: "Legal", position: "Legal Counsel", email: "l.morgan@nexus-sys.internal", phone: "x4600", notes: "Contract review access" },
      "1009": { id: "1009", name: "Admin Account", department: "IT", position: "System Administrator", email: "admin@nexus-sys.internal", phone: "x4000", notes: "Primary admin - username: sysadmin", access_level: "admin", status: "Active - password reset required" },
      "1010": { id: "1010", name: "Service Account", department: "Automation", position: "Automated Process", email: "noreply@nexus-sys.internal", phone: "N/A", notes: "Do not modify - automated processes depend on this account" }
    };

    console.log(`[Puzzle W1] Employee request - ID: ${employeeId}`);

    // Add Base64 hint header
    res.setHeader('X-Internal-Note', 'U2VjdXJpdHkgY2xlYXJhbmNlIHJlcXVpcmVkLiBGaW5kIHRoZSBhY2Nlc3NfY29kZSBpbiBlbXBsb3llZSByZWNvcmRzLg==');

    if (!employeeId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing employee ID', hint: 'Use ?id= parameter' }));
      return;
    }

    const employee = employees[employeeId];
    if (employee) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(employee));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Employee not found' }));
    }
    return;
  }

  // Puzzle Week 1: Login endpoint (Username enumeration + Request tampering)
  if (parsedUrl.pathname === '/api/puzzle/week1/login' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const params = new URLSearchParams(body);
      const username = params.get('username')?.toLowerCase();
      const password = params.get('password');
      const accessCode = params.get('access_code');

      const validUsernames = ["jmitchell", "schen", "mtorres", "ewatson", "dpark", "jadams", "rkim", "lmorgan", "sysadmin", "service"];
      const REQUIRED_ACCESS_CODE = "N3XU5-7R41N-2026";
      const ADMIN_USERNAME = "sysadmin";
      const ADMIN_PASSWORD = "nexus2026";

      console.log(`[Puzzle W1] Login attempt - Username: ${username}, Access Code: ${accessCode ? 'present' : 'none'}`);

      // Username enumeration
      if (!validUsernames.includes(username)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Account not found',
          _debug: 'Check /api/puzzle/week1/employees?id=1001 for valid employee records'
        }));
        return;
      }

      // Admin login flow
      if (username === ADMIN_USERNAME) {
        if (password !== ADMIN_PASSWORD) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Incorrect password' }));
          return;
        }

        if (!accessCode) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Security verification required' }));
          return;
        }

        if (accessCode !== REQUIRED_ACCESS_CODE) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid security code' }));
          return;
        }

        // SUCCESS
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Welcome to Nexus Systems, Administrator.',
          flag: 'DACC{burp_m4st3r_ch41n3d_3xpl01ts_w33k1}',
          methodology: 'Congratulations! You combined username enumeration, IDOR exploitation, and request tampering to gain admin access.'
        }));
        return;
      }

      // Non-admin users
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Incorrect password' }));
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n🔒 BurpSuite Demo API Server running on http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  - POST /api/burpsuite/demo1/login (Demo 1 - Login)`);
  console.log(`  - GET  /api/documents?id=:id (Demo 2 - IDOR)`);
  console.log(`  - POST /api/auth/login (Demo 3 - Username Enumeration)`);
  console.log(`  - GET  /api/booking?data=:data (Demo 4 - Base64 Decode)`);
  console.log(`\nWeekly Puzzle Endpoints:`);
  console.log(`  - GET  /api/puzzle/week1/employees?id=:id (Week 1 - IDOR)`);
  console.log(`  - POST /api/puzzle/week1/login (Week 1 - Login)`);
  console.log(`\nConfigure Burp Suite to intercept requests to localhost:${PORT}\n`);
});
