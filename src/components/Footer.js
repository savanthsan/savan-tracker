import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 py-10 border-t-2 border-secondary bg-background font-mono relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Copyright */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[8px_2px_8px_2px/2px_8px_2px_8px] bg-secondary flex items-center justify-center font-extrabold text-white shadow-[1.5px_1.5px_0px_var(--secondary)] text-sm">
                S
              </div>
              <span className="font-bold text-xl text-secondary font-sans">
                Savan
              </span>
            </Link>
            <p className="text-sm text-slate-655 leading-relaxed pr-4">
              Organize your tasks and track your finances with ease. Savan AI reviews your productivity and budget to help you stay on top of your game.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-secondary mb-4 uppercase tracking-wider text-sm">Legal</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary underline-offset-2">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary underline-offset-2">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Support / Social */}
          <div>
            <h3 className="font-bold text-secondary mb-4 uppercase tracking-wider text-sm">Connect</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>
                <a href="mailto:support@example.com" className="hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary underline-offset-2">
                  Support
                </a>
              </li>
              <li>
                <a href="https://github.com/savanthsan" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary underline-offset-2">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 text-center flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-bold">
            &copy; {currentYear} Savan Tracker. All rights reserved.
          </p>
          <div className="text-[10px] text-slate-400">
            Powered by Next.js & Supabase
          </div>
        </div>
      </div>
    </footer>
  );
}
