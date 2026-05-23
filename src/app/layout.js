import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";
import NotificationHandler from "@/components/NotificationHandler";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Savan - AI Planner & Expense Tracker",
  description: "Gain complete clarity over your tasks and finances with Savan, a beautiful visual planner and intelligent budget advisor powered by Gemini AI.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProvider>
          <NotificationHandler />
          <div className="flex flex-col md:flex-row min-h-screen">
            <Navbar />
            <main className="flex-1 w-full p-4 md:p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
