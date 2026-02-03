import { useState, useEffect } from "react";

function Weekly() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Get current time in PST
      const now = new Date();
      const pstTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

      // Set target to Feb 3rd, 2026 at 12 PM noon PST
      const target = new Date("2026-02-03T12:00:00");

      const difference = target.getTime() - pstTime.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">cd /weekly</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            Weekly <span className="text-matrix neon-text">Challenge</span>
          </h1>
          <p className="text-gray-400 text-lg">
            New challenges released every week
          </p>
        </div>

        {/* Countdown */}
        <div className="card-hack p-12 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-matrix mb-8">Next Challenge Releases In</h2>

          <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            <div className="card-hack p-6 rounded-lg bg-matrix/5">
              <div className="text-5xl md:text-6xl font-bold text-matrix neon-text mb-2">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Days</div>
            </div>

            <div className="card-hack p-6 rounded-lg bg-matrix/5">
              <div className="text-5xl md:text-6xl font-bold text-matrix neon-text mb-2">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Hours</div>
            </div>

            <div className="card-hack p-6 rounded-lg bg-matrix/5">
              <div className="text-5xl md:text-6xl font-bold text-matrix neon-text mb-2">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Minutes</div>
            </div>

            <div className="card-hack p-6 rounded-lg bg-matrix/5">
              <div className="text-5xl md:text-6xl font-bold text-matrix neon-text mb-2">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Seconds</div>
            </div>
          </div>

          <div className="text-gray-400 text-sm">
            Countdown to Feb 3rd, 12:00 PM PST
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="card-hack p-6 rounded-lg">
            <h3 className="text-xl font-bold text-matrix mb-4">📅 Weekly Schedule</h3>
            <p className="text-gray-400 text-sm mb-3">
              Next challenge releases on Feb 3rd at 12:00 PM PST.
            </p>
            <p className="text-gray-400 text-sm">
              Each challenge tests your skills in web security, cryptography, reverse engineering, and more.
            </p>
          </div>

          <div className="card-hack p-6 rounded-lg">
            <h3 className="text-xl font-bold text-matrix mb-4">🏆 How to Participate</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex gap-2">
                <span className="text-matrix">1.</span>
                <span>Wait for the countdown to reach zero</span>
              </li>
              <li className="flex gap-2">
                <span className="text-matrix">2.</span>
                <span>Solve the challenge using your hacking skills</span>
              </li>
              <li className="flex gap-2">
                <span className="text-matrix">3.</span>
                <span>Submit your flag to claim your victory</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Weekly;
