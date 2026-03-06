import { useEffect } from "react";

const CTFD_URL = "https://dactf.com/";

function CTF() {
  useEffect(() => {
    window.location.href = CTFD_URL;
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
      <div className="text-center">
        <div className="font-terminal text-lg neon-pulse mb-4">Redirecting to CTFd...</div>
        <a
          href={CTFD_URL}
          className="cli-btn-filled px-6 py-3 inline-block"
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  );
}

export default CTF;
