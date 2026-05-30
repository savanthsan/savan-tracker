import DashboardClient from './DashboardClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getWeekStartDate } from '@/lib/context';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialAiSnippet = null;

  if (user) {
    const currentWeekStart = getWeekStartDate();
    const { data } = await supabase
      .from('ai_reviews')
      .select('*')
      .eq('week_start_date', currentWeekStart)
      .maybeSingle();
      
    initialAiSnippet = data || null;
  }

  return <DashboardClient initialAiSnippet={initialAiSnippet} />;
}
