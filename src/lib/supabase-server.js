import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('savan-session')?.value;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    },
  });

  return supabase;
}
