import Link from 'next/link';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Savan',
  description: 'Terms of Service for Savan Tracker',
};

export default function TermsOfService() {
  const lastUpdated = "May 30, 2026";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold font-mono text-secondary hover:text-primary transition-colors mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="doodle-card p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-secondary font-sans mb-4">Terms of Service</h1>
          <p className="text-sm text-slate-500 font-mono mb-10">Last updated: {lastUpdated}</p>

          <div className="space-y-8 font-sans text-slate-800 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Savan Tracker (&ldquo;Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">2. Description of Service</h2>
              <p>
                Savan Tracker is a personal task and finance management tool. We provide a platform for organizing daily checklists, tracking weekly budgets, and receiving AI-generated insights regarding your productivity and financial habits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">3. User Accounts</h2>
              <p>
                If you create an account on the Service, you are responsible for maintaining the security of your account, and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it. You must immediately notify us of any unauthorized uses of your account or any other breaches of security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">4. Disclaimer of Warranties</h2>
              <p className="p-4 bg-amber-50 border border-secondary rounded font-mono text-sm shadow-[2px_2px_0px_var(--secondary)]">
                The Service is provided &ldquo;as is&rdquo;. We and our suppliers and licensors hereby disclaim all warranties of any kind, express or implied, including, without limitation, the warranties of merchantability, fitness for a particular purpose and non-infringement. We do not make any warranty that the Service will be error free or that access thereto will be continuous or uninterrupted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">5. Limitation of Liability</h2>
              <p>
                In no event will Savan Tracker, or its suppliers or licensors, be liable with respect to any subject matter of this agreement under any contract, negligence, strict liability or other legal or equitable theory for: (i) any special, incidental or consequential damages; (ii) the cost of procurement for substitute products or services; (iii) for interruption of use or loss or corruption of data.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
