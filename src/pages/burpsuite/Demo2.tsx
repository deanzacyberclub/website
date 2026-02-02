import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Document } from "@/lib/cyberIcon";

interface Document {
  title: string;
  content: string;
  classification: string;
}

const documents: { [key: string]: Document } = {
  "1001": {
    title: "Your Performance Review",
    content: "Employee: John Smith\nRating: Meets Expectations\nSalary: $75,000\nReview Period: Q4 2025\nManager Comments: Solid performer, shows up on time.",
    classification: "personal",
  },
  "1002": {
    title: "CEO Salary Information",
    content: "Employee: Jane Doe\nPosition: Chief Executive Officer\nBase Salary: $2,400,000\nAnnual Bonus: $500,000\nStock Options: 100,000 shares\nPerks: Company car, executive housing",
    classification: "executive-confidential",
  },
  "1003": {
    title: "Upcoming Layoffs Plan",
    content: "Q3 2026 Restructuring Plan\n\nAction: Terminate 15% of engineering staff\nDepartments affected: Backend, DevOps, QA\nTimeline: August 2026\n\n⚠️ DO NOT DISCLOSE until official announcement\nSeverance packages prepared\nPR strategy in development",
    classification: "board-confidential",
  },
  "1004": {
    title: "Merger & Acquisition Plans",
    content: "CONFIDENTIAL - ATTORNEY-CLIENT PRIVILEGED\n\nAcquisition Target: TechStartup Inc.\nProposed Price: $50,000,000\nDue Diligence Status: In Progress\nExpected Close: Q2 2026\n\n⚠️ Keep confidential until SEC filing\nLegal team: Wilson & Associates\nInvestment bank: Goldman Sachs",
    classification: "legal-confidential",
  },
};

function Demo2() {
  const [documentId, setDocumentId] = useState("");
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDocument = async (id: string) => {
    setLoading(true);
    setError("");
    setDocumentId(id);

    try {
      // Make a real HTTP GET request that Burp Suite can intercept
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const doc = await response.json();
        setDocument(doc);
      } else {
        setError("Document not found");
        setDocument(null);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      setDocument(null);
      console.error("API Error:", err);
    }

    setLoading(false);
  };

  const handleGetMyReport = () => {
    // This will trigger a request that can be intercepted
    fetchDocument("1001");
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "personal":
        return "text-blue-400 border-blue-400/30 bg-blue-400/10";
      case "executive-confidential":
        return "text-orange-400 border-orange-400/30 bg-orange-400/10";
      case "board-confidential":
        return "text-red-400 border-red-400/30 bg-red-400/10";
      case "legal-confidential":
        return "text-purple-400 border-purple-400/30 bg-purple-400/10";
      default:
        return "text-gray-400 border-gray-400/30 bg-gray-400/10";
    }
  };

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <Link
          to="/burpsuite"
          className="inline-flex items-center gap-2 text-matrix hover:neon-text-subtle transition-all mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Demos
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Document Viewer */}
          <div>
            <div className="card-hack p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <Document className="w-8 h-8 text-matrix" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Acme Corp</h1>
                  <p className="text-gray-500 text-sm">Document Portal</p>
                </div>
              </div>

              {!documentId && !loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-6">Click below to retrieve your performance review</p>
                  <button
                    onClick={handleGetMyReport}
                    className="btn-hack-filled rounded-lg px-6 py-3 font-semibold"
                  >
                    Get My Performance Review
                  </button>
                </div>
              ) : loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading document...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : document ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-matrix">{document.title}</h2>
                    <span
                      className={`text-xs px-2 py-1 rounded border font-terminal uppercase ${getClassificationColor(document.classification)}`}
                    >
                      {document.classification}
                    </span>
                  </div>

                  <div className="bg-terminal-alt border border-gray-700 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {document.content}
                    </pre>
                  </div>

                  <div className="text-xs text-gray-500 font-mono">
                    Document ID: {documentId}
                  </div>
                </div>
              ) : null}

              {documentId && (
                <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <p className="text-xs text-gray-400 font-mono mb-2">API Endpoint:</p>
                  <code className="text-xs text-matrix font-mono">
                    GET /api/documents?id={documentId}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo2;
