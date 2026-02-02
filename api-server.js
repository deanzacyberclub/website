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
  console.log(`\nConfigure Burp Suite to intercept requests to localhost:${PORT}\n`);
});
