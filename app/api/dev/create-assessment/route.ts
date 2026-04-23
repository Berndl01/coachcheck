import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DEV ONLY — allows authenticated users to create a test assessment
 * for any package without going through Stripe.
 *
 * Disabled in production via NODE_ENV check.
 * Access: POST /api/dev/create-assessment?slug=schnelltest
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? 'schnelltest';

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!product) return NextResponse.json({ error: 'product not found' }, { status: 404 });

  const { data: assessment, error } = await supabase
    .from('assessments')
    .insert({
      user_id: user.id,
      product_id: product.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL(`/assessment/${assessment.id}`, request.url), 303);
}

// Allow GET too for convenience
export const GET = POST;
