import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Globe, Copy } from "@/lib/cyberIcon";

const bookingData1 = {
  booking_id: "AC-98234",
  passenger: "John Smith",
  flight: "AC-1234",
  from: "JFK",
  to: "LAX",
  date: "2024-03-15",
  seat: "12A",
  frequent_flyer: "FF-8821937",
  credit_card_last4: "4532",
  paid_amount: "$487.50",
};

const bookingData2 = {
  booking_id: "AC-55512",
  passenger: "Jane Doe",
  flight: "AC-5678",
  class: "first",
  from: "SFO",
  to: "JFK",
  date: "2024-04-20",
  seat: "1A",
  upgrade_code: "COMP-EXEC-2024",
  paid_amount: "$0.00 (Complimentary)",
};

function Demo4() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    const refParam = searchParams.get("ref");

    if (dataParam) {
      try {
        // Decode Base64
        const decoded = atob(dataParam);
        const data = JSON.parse(decoded);
        setBookingInfo(data);
      } catch (err) {
        console.error("Failed to decode booking data");
      }
    } else if (refParam) {
      try {
        // First URL decode, then Base64 decode
        const urlDecoded = decodeURIComponent(refParam);
        const base64Decoded = atob(urlDecoded);
        const data = JSON.parse(base64Decoded);
        setBookingInfo(data);
      } catch (err) {
        console.error("Failed to decode booking reference");
      }
    }
  }, [searchParams]);

  const loadExample1 = () => {
    const encoded = btoa(JSON.stringify(bookingData1));
    setSearchParams({ data: encoded });
  };

  const loadExample2 = () => {
    const base64 = btoa(JSON.stringify(bookingData2));
    const urlEncoded = encodeURIComponent(base64);
    setSearchParams({ ref: urlEncoded });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrentUrlParam = () => {
    const dataParam = searchParams.get("data");
    const refParam = searchParams.get("ref");
    return dataParam || refParam || "";
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking Confirmation */}
          <div>
            <div className="card-hack p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-8 h-8 text-matrix" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Acme Airlines</h1>
                  <p className="text-gray-500 text-sm">Booking Confirmation</p>
                </div>
              </div>

              {!bookingInfo ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-6">Load a booking to view details</p>
                  <div className="space-y-3">
                    <button
                      onClick={loadExample1}
                      className="w-full btn-hack rounded-lg py-3 font-semibold"
                    >
                      Load Booking Example 1 (Simple Base64)
                    </button>
                    <button
                      onClick={loadExample2}
                      className="w-full btn-hack rounded-lg py-3 font-semibold"
                    >
                      Load Booking Example 2 (Nested Encoding)
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-matrix mb-2">
                      ✓ Booking Confirmed
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Your reservation has been confirmed
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-lg bg-terminal-alt border border-gray-700">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(bookingInfo).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-gray-500 text-xs uppercase">{key.replace(/_/g, " ")}</p>
                            <p className="text-white font-semibold">{value as string}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={copyUrl}
                      className="w-full btn-hack rounded-lg py-3 font-semibold flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Share Your Itinerary"}
                    </button>
                    <button className="w-full btn-hack-filled rounded-lg py-3 font-semibold">
                      Modify Booking
                    </button>
                  </div>

                  {getCurrentUrlParam() && (
                    <div className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Encoded Data in URL:</p>
                      <code className="text-xs text-matrix font-mono break-all">
                        {getCurrentUrlParam()}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <div className="card-hack p-6 rounded-lg">
              <h2 className="text-xl font-bold text-matrix mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Demo 4: Exposed Encoded Data
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                This booking system stores sensitive passenger data in Base64-encoded URL parameters. Encoding is NOT encryption - it's easily reversible.
              </p>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">What to Demonstrate:</h3>
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">1.</span>
                  <span>Load Example 1 and copy the full URL</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">2.</span>
                  <span>Open Burp Suite's <span className="text-matrix font-mono">Decoder</span> tab</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">3.</span>
                  <span>Copy the Base64 string from the URL parameter</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">4.</span>
                  <span>Paste into Decoder and click <span className="text-matrix font-mono">"Decode as Base64"</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">5.</span>
                  <span>Show the exposed JSON with sensitive data (credit card, frequent flyer, etc.)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">6.</span>
                  <span>For Example 2, decode URL encoding first, then Base64</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-matrix font-bold">7.</span>
                  <span>Modify the decoded JSON, re-encode it, and show you can manipulate bookings</span>
                </li>
              </ol>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">Decoding Steps:</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div>
                  <p className="text-matrix font-bold mb-1">Example 1 (Simple):</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Copy the <span className="font-mono">data=</span> parameter value</li>
                    <li>Decode as Base64 in Burp Decoder</li>
                    <li>View the plaintext JSON</li>
                  </ol>
                </div>
                <div>
                  <p className="text-matrix font-bold mb-1">Example 2 (Nested):</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Copy the <span className="font-mono">ref=</span> parameter value</li>
                    <li>First decode as URL encoding</li>
                    <li>Then decode the result as Base64</li>
                    <li>View the plaintext JSON with upgrade codes</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="card-hack p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-3">Try This Attack:</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>1. Decode the booking data</p>
                <p>2. Change the seat from "12A" to "1A" (first class)</p>
                <p>3. Change the paid_amount to "$0.00"</p>
                <p>4. Re-encode the modified JSON as Base64</p>
                <p>5. Replace the URL parameter with your tampered version</p>
                <p>6. Reload the page - your changes appear!</p>
              </div>
            </div>

            <div className="card-hack p-6 rounded-lg border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold text-red-400 mb-3">Real-World Impact:</h3>
              <p className="text-sm text-gray-400 mb-2">
                In 2018, a major airline stored passenger details in Base64 in the URL, allowing anyone to decode and view booking information.
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-bold">Encoding ≠ Encryption.</span> Encoding is reversible without a key. Always use proper encryption and server-side validation for sensitive data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Demo4;
