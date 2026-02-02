import { Link } from "react-router-dom";
import { Shield, Lock, Key } from "@/lib/cyberIcon";

const demos = [
  {
    id: 1,
    title: "Proxy Intercept - Insecure Login Form",
    description: "Learn how to intercept HTTP requests and view credentials in plain text using Burp Suite's Proxy feature.",
    path: "/burpsuite/demo1",
    icon: Lock,
  },
  {
    id: 2,
    title: "Repeater - IDOR Vulnerability",
    description: "Discover Insecure Direct Object Reference vulnerabilities by modifying API parameters to access unauthorized data.",
    path: "/burpsuite/demo2",
    icon: Key,
  },
  {
    id: 3,
    title: "Intruder - Username Enumeration",
    description: "Automate attacks to enumerate valid usernames by analyzing different error message responses.",
    path: "/burpsuite/demo3",
    icon: Shield,
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
        </div>

        {/* Demo Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <Link
                key={demo.id}
                to={demo.path}
                className="card-hack rounded-lg hover:border-matrix/60 transition-all block"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-matrix" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-matrix mb-2">
                        Demo {demo.id}: {demo.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {demo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTF Challenge */}
        <div className="mt-12 card-hack p-8 rounded-lg border-2 border-matrix/40 bg-gradient-to-br from-matrix/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚩</span>
            <h2 className="text-3xl font-bold text-matrix">Launch Week Challenge</h2>
          </div>
          <p className="text-gray-300 mb-4 text-lg">
            Think you've mastered the demos? Put your skills to the test with our CTF puzzle.
          </p>
          <p className="text-gray-400 mb-6 text-sm">
            First person to capture the flag wins! This challenge requires creative thinking and mastery of Proxy, Repeater, and Intruder techniques.
          </p>
          <Link
            to="/burpsuite/dashboard"
            className="inline-block btn-hack-filled rounded-lg px-8 py-4 font-semibold text-lg"
          >
            Launch Week 1 Puzzle →
          </Link>
        </div>

        {/* Instructions */}
        <div className="mt-8 card-hack p-6 rounded-lg">
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
