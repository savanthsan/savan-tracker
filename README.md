# Savan Tracker

A personal finance and task management dashboard built with Next.js, Supabase, and powered by Gemini AI.

**🌐 Live Demo:** [https://savan-tracker-1.onrender.com/)

## Features

- **Authentication:** Secure user sign-up and login powered by Supabase Auth.
- **Task Planner:** Manage weekly tasks with priority levels and tracking.
- **Expense Log:** Record and track your expenses against a customizable weekly budget.
- **AI Advisor:** Get automated, personalized productivity and financial advice using Google's Gemini AI.
- **Dynamic Dashboard:** View real-time visual statistics, including task completion rates and 7-day spending trends.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase
- **AI Integration:** Google Generative AI (Gemini 2.5 Flash)
- **Deployment:** Netlify
- **Styling:** Tailwind CSS

## Recent Updates

- **Migrated to Netlify:** Successfully transitioned hosting from Vercel to Netlify for improved deployment stability and native Next.js Edge Runtime compatibility.
- **Auth Flow Fix:** Replaced Next.js soft-routing with hard browser redirects to completely bypass client-side caching loops during session expiration.
- **Gemini AI Integration:** Fully configured the AI Advisor page to process tasks and budgets using the `GEMINI_API_KEY` environment variable.
- **Edge Middleware:** Activated robust route protection that instantly blocks unauthorized visitors from accessing the dashboard.

## Getting Started Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-api-key
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

---
*Developed for Savan.*
