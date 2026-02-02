import { Link } from "react-router-dom";
import { Shield, Lock, Key, Code } from "@/lib/cyberIcon";

const demos = [
  {
    id: 1,
    title: "Proxy Intercept - Insecure Login Form",
    description: "Learn how to intercept HTTP requests and view credentials in plain text using Burp Suite's Proxy feature.",
    path: "/burpsuite/demo1",
    icon: Lock,
    topics: ["HTTP Interception", "Form Data Analysis", "Session Tokens", "Hidden Fields"],
  },
  {
    id: 2,
    title: "Repeater - IDOR Vulnerability",
    description: "Discover Insecure Direct Object Reference vulnerabilities by modifying API parameters to access unauthorized data.",
    path: "/burpsuite/demo2",
    icon: Key,
    topics: ["IDOR", "API Security", "Authorization Testing", "Parameter Tampering"],
  },
  {
    id: 3,
    title: "Intruder - Username Enumeration",
    description: "Automate attacks to enumerate valid usernames by analyzing different error message responses.",
    path: "/burpsuite/demo3",
    icon: Shield,
    topics: ["Username Enumeration", "Automated Attacks", "Response Analysis", "Password Spraying"],
  },
  {
    id: 4,
    title: "Decoder - Exposed Encoded Data",
    description: "Understand why encoding is not encryption by decoding Base64-encoded sensitive data in URLs.",
    path: "/burpsuite/demo4",
    icon: Code,
    topics: ["Base64 Decoding", "Data Exposure", "URL Parameters", "Encoding vs Encryption"],
  },
];

function BurpSuite() {
  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">cd /demos/burpsuite</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Burp Suite <span className="text-matrix neon-text">Demo Lab</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-3xl">
            Welcome to the DACC Burp Suite practice environment. These intentionally vulnerable applications demonstrate common web security flaws and how to discover them using Burp Suite.
          </p>
          <div className="mt-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-sm">
              <span className="font-bold">⚠️ EDUCATIONAL USE ONLY:</span> These demos contain intentional security vulnerabilities. They are for authorized security training purposes only. Do not use these techniques on systems you don't own or have explicit permission to test.
            </p>
          </div>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <Link
                key={demo.id}
                to={demo.path}
                className="card-hack p-6 rounded-lg hover:border-matrix/60 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-matrix" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-matrix mb-2 group-hover:neon-text-subtle transition-all">
                      Demo {demo.id}: {demo.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {demo.description}
                    </p>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-2">
                  {demo.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 font-terminal"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-12 card-hack p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-matrix mb-4">Getting Started</h2>
          <ol className="space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="text-matrix font-terminal">1.</span>
              <span>Open Burp Suite and configure your browser to use it as a proxy (typically localhost:8080)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-matrix font-terminal">2.</span>
              <span>Navigate to any demo page above</span>
            </li>
            <li className="flex gap-3">
              <span className="text-matrix font-terminal">3.</span>
              <span>Follow the on-screen instructions to interact with the vulnerable application</span>
            </li>
            <li className="flex gap-3">
              <span className="text-matrix font-terminal">4.</span>
              <span>Use Burp Suite's tools (Proxy, Repeater, Intruder, Decoder) to analyze and exploit the vulnerabilities</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default BurpSuite;
