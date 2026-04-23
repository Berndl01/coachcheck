// Auto-generated types will go here later via `supabase gen types`.
// For now, minimal hand-rolled types for what we use.

export type Product = {
  id: number;
  slug: string;
  name_de: string;
  tier: number;
  price_cents: number;
  stripe_price_id: string | null;
  description: string | null;
  features: string[];
  item_count: number | null;
  duration_min: number | null;
  active: boolean;
};

export type Archetype = {
  id: number;
  code: string;
  name_de: string;
  short_trait: string;
  kernmuster: string;
  staerken: string[];
  risiken: string[];
  entwicklungshebel: string[];
  axis_profile: Record<string, number>;
};

export type Assessment = {
  id: string;
  user_id: string;
  product_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'report_ready' | 'archived';
  progress_pct: number;
  current_item_index: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  primary_archetype_id: number | null;
  secondary_archetype_id: number | null;
  axis_scores: Record<string, number> | null;
  signature: Record<string, unknown> | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  sport: string | null;
  role: string | null;
  club: string | null;
};
