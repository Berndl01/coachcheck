import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRaterReminders, sendResumeReminders } from '@/lib/email/progress-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Zeitbasierte Erinnerungen (Resend):
 *  - Rater-Reminder: Fremdbild-Geber, die noch nicht geantwortet haben.
 *  - Resume-Nudge:   angefangene, nicht beendete Assessments.
 *
 * Schutz: Header `Authorization: Bearer <CRON_SECRET>` (Vercel Cron setzt das
 * automatisch, wenn CRON_SECRET als Env gesetzt ist). Ohne CRON_SECRET: 503.
 */
async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const raters = await sendRaterReminders(admin);
  const resumes = await sendResumeReminders(admin);

  return NextResponse.json({ raters, resumes });
}

export async function POST(request: NextRequest) {
  return run(request);
}

export async function GET(request: NextRequest) {
  return run(request);
}
