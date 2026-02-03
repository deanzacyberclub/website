// Employee database - IDOR vulnerability demonstration
const employees = {
  "1001": {
    id: "1001",
    name: "John Mitchell",
    department: "Sales",
    position: "Sales Associate",
    email: "j.mitchell@nexus-sys.internal",
    phone: "x4521",
    notes: "Standard employee access"
  },
  "1002": {
    id: "1002",
    name: "Sarah Chen",
    department: "Engineering",
    position: "Software Developer",
    email: "s.chen@nexus-sys.internal",
    phone: "x4102",
    notes: "Has repository access"
  },
  "1003": {
    id: "1003",
    name: "Michael Torres",
    department: "HR",
    position: "HR Coordinator",
    email: "m.torres@nexus-sys.internal",
    phone: "x4200",
    notes: "Employee records access"
  },
  "1004": {
    id: "1004",
    name: "Emily Watson",
    department: "Finance",
    position: "Financial Analyst",
    email: "e.watson@nexus-sys.internal",
    phone: "x4301",
    notes: "Budget system access"
  },
  "1005": {
    id: "1005",
    name: "David Park",
    department: "IT",
    position: "System Administrator",
    email: "d.park@nexus-sys.internal",
    phone: "x4050",
    notes: "Infrastructure access - Level 2",
    access_level: "elevated"
  },
  "1006": {
    id: "1006",
    name: "Jennifer Adams",
    department: "Marketing",
    position: "Marketing Manager",
    email: "j.adams@nexus-sys.internal",
    phone: "x4410",
    notes: "Campaign system access"
  },
  "1007": {
    id: "1007",
    name: "Robert Kim",
    department: "Security",
    position: "Security Engineer",
    email: "r.kim@nexus-sys.internal",
    phone: "x4001",
    notes: "RESTRICTED - Do not share access_code: N3XU5-7R41N-2026",
    access_level: "security",
    clearance: "Level 4"
  },
  "1008": {
    id: "1008",
    name: "Lisa Morgan",
    department: "Legal",
    position: "Legal Counsel",
    email: "l.morgan@nexus-sys.internal",
    phone: "x4600",
    notes: "Contract review access"
  },
  "1009": {
    id: "1009",
    name: "Admin Account",
    department: "IT",
    position: "System Administrator",
    email: "admin@nexus-sys.internal",
    phone: "x4000",
    notes: "Primary admin - username: sysadmin",
    password: "nexus2026",
    access_level: "admin",
    status: "Active"
  },
  "1010": {
    id: "1010",
    name: "Service Account",
    department: "Automation",
    position: "Automated Process",
    email: "noreply@nexus-sys.internal",
    phone: "N/A",
    notes: "Do not modify - automated processes depend on this account"
  }
};

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    // Creative twist #2: Base64 encoded hint in response header
    // Decodes to: "Security clearance required. Find the access_code in employee records."
    'X-Internal-Note': 'U2VjdXJpdHkgY2xlYXJhbmNlIHJlcXVpcmVkLiBGaW5kIHRoZSBhY2Nlc3NfY29kZSBpbiBlbXBsb3llZSByZWNvcmRzLg=='
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  const url = new URL(req.url);
  const employeeId = url.searchParams.get('id');

  if (!employeeId) {
    return new Response(
      JSON.stringify({
        error: 'Missing employee ID',
        hint: 'Use ?id= parameter'
      }),
      { status: 400, headers }
    );
  }

  const employee = employees[employeeId];

  if (employee) {
    return new Response(
      JSON.stringify(employee),
      { status: 200, headers }
    );
  } else {
    return new Response(
      JSON.stringify({ error: 'Employee not found' }),
      { status: 404, headers }
    );
  }
};
