import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('Error exchanging code for session:', err);
    }
  }

  // Redirect to dashboard page
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
