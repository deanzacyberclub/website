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

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
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
  const documentId = url.searchParams.get('id');

  console.log(`[Demo 2] Document request - ID: ${documentId}`);

  const doc = documents[documentId];
  if (doc) {
    return new Response(JSON.stringify(doc), { status: 200, headers });
  } else {
    return new Response(
      JSON.stringify({ error: 'Document not found' }),
      { status: 404, headers }
    );
  }
};
