import Link from 'next/link';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Savan',
  description: 'Privacy Policy for Savan Tracker',
};

export default function PrivacyPolicy() {
  const lastUpdated = "May 30, 2026";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold font-mono text-secondary hover:text-primary transition-colors mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="doodle-card p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-secondary font-sans mb-4">Privacy Policy</h1>
          <p className="text-sm text-slate-500 font-mono mb-10">Last updated: {lastUpdated}</p>

          <div className="space-y-8 font-sans text-slate-800 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">1. Introduction</h2>
              <p>
                Welcome to Savan Tracker ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">2. Data We Collect</h2>
              <p className="mb-2">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm font-mono text-slate-700">
                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data:</strong> includes email address.</li>
                <li><strong>Financial & Task Data:</strong> includes your personal budgets, expenses, and task planner entries that you voluntarily input into the application.</li>
                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">3. How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2 text-sm font-mono text-slate-700">
                <li>To provide and maintain our Service.</li>
                <li>To manage your account and authentication via Supabase.</li>
                <li>To generate AI-powered insights regarding your tasks and budgets using Gemini API. (Note: Data sent to external AI providers is heavily sanitized and anonymized where possible).</li>
                <li>To notify you about changes to our Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">4. Cookies and Web Storage</h2>
              <p>
                We use cookies and similar tracking technologies (like local storage) to track the activity on our Service and store certain information. Specifically, we use secure HttpOnly cookies to maintain your authenticated session. You can instruct your browser to refuse all cookies, but if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3">5. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us via the support links provided in our footer or at our GitHub repository.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
