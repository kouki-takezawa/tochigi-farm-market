import { Env, json, notFound, requireAdmin, getSupabase, serverError } from "../../../../_lib/util";

// DELETE /api/farmers/:id/reviews/:reviewId -> 不適切な評価の削除(管理者のみのモデレーション)
export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const farmerId = params.id as string;
  const reviewId = params.reviewId as string;
  const supabase = getSupabase(env);

  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("farmer_id", farmerId)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("評価が見つかりません");

  return json({ ok: true });
};
