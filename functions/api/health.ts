import { Env, json, getSupabase, serverError } from "../_lib/util";

// GET /api/health -> Supabaseへの軽いクエリを実行して疎通確認
// Supabase無料プランは7日間アクセスがないと自動で一時停止されるため、
// GitHub Actions (.github/workflows/keep-alive.yml) から定期的にこのエンドポイントを叩いて防止する。
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const supabase = getSupabase(env);
  const { error } = await supabase.from("farmers").select("id").limit(1);

  if (error) return serverError(error.message);

  return json({ ok: true, checked_at: new Date().toISOString() });
};
