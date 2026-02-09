import { Link, useLocation } from "react-router-dom";

interface FooterProps {
  className?: string;
}

function Footer({ className = "" }: FooterProps) {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-gray-200 dark:border-matrix/20 ${className}`}>
      {/* Top status bar */}
      <div className="border-b border-gray-200 dark:border-matrix/20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between font-mono text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-wider flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-matrix">&gt;</span>
            <span className="text-gray-500 dark:text-gray-500">
              /{location.pathname.split("/").filter(Boolean).join("/")}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix inline-block animate-pulse" />
            <span className="text-green-600 dark:text-matrix/50">[200]</span> OK
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              ABOUT
            </h3>
            <p className="font-mono text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
              De Anza Cybersecurity Club — hands-on workshops, CTF competitions,
              and industry certifications for students of all skill levels.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              QUICK LINKS
            </h3>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link
                  to="/meetings"
                  className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors"
                >
                  &gt; Events
                </Link>
              </li>
              <li>
                <Link
                  to="/ctf"
                  className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors"
                >
                  &gt; CTF
                </Link>
              </li>
              <li>
                <Link
                  to="/legal"
                  className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors"
                >
                  &gt; Legal
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg/v5JWDrZVNp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors"
                >
                  &gt; Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              DEVELOPERS
            </h3>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <a
                  href="https://github.com/aaronhma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors"
                >
                  &gt; Aaron Ma
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/boredcreator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors"
                >
                  &gt; Neel Anshu
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-gray-200 dark:border-matrix/20 pt-6">
          <p className="font-mono text-xs text-gray-500 dark:text-gray-600 text-center uppercase tracking-wider">
            © {currentYear} DE ANZA CYBERSECURITY CLUB. MADE WITH 💖 FROM
            CUPERTINO.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
