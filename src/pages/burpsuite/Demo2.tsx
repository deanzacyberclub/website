import { useState } from "react";
import { Link } from "react-router-dom";

interface DocumentType {
  title: string;
  content: string;
  classification: string;
}

function Demo2() {
  const [documentId, setDocumentId] = useState("");
  const [document, setDocument] = useState<DocumentType | null>(null);
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
        return "text-blue-600 border-blue-300 bg-blue-50";
      case "executive-confidential":
        return "text-orange-600 border-orange-300 bg-orange-50";
      case "board-confidential":
        return "text-red-600 border-red-300 bg-red-50";
      case "legal-confidential":
        return "text-purple-600 border-purple-300 bg-purple-50";
      default:
        return "text-gray-600 border-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <img src="/hive.png" alt="The Hive" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold text-gray-900">The Hive</span>
            </div>
            <span className="text-sm text-gray-500">Document Portal</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Document Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">The Hive Docs</h1>
              <p className="text-gray-500 text-sm">Secure document portal</p>
            </div>
          </div>

          {!documentId && !loading ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6">Click below to retrieve your performance review</p>
              <button
                onClick={handleGetMyReport}
                className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Get My Performance Review
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500">Loading document...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : document ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{document.title}</h2>
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-medium uppercase ${getClassificationColor(document.classification)}`}
                >
                  {document.classification}
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {document.content}
                </pre>
              </div>

              <div className="text-xs text-gray-500 font-mono">
                Document ID: {documentId}
              </div>
            </div>
          ) : null}

          {documentId && (
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 font-mono mb-2">API Endpoint:</p>
              <code className="text-xs text-amber-600 font-mono font-medium">
                GET /api/documents?id={documentId}
              </code>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link
            to="/burpsuite"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            ← Back to Burp Suite Demos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Demo2;
