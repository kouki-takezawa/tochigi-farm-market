import { Env, json, badRequest, notFound, newId, nowSeconds, getSupabase, serverError } from "../../../../_lib/util";

// GET /api/farmers/:id/reviews -> 農家への評価一覧(公開)
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const farmerId = params.id as string;
  const supabase = getSupabase(env);

  const { data, error } = await supabase
    .from("reviews")
    .select("id, reviewer_name, rating, comment, created_at")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return serverError(error.message);

  return json({ reviews: data ?? [] });
};

// POST /api/farmers/:id/reviews -> 評価を投稿(公開・認証不要。全国の初対面ユーザー間の
// 信頼材料として、購入者が農家に評価・コメントを残せるようにする)
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const supabase = getSupabase(env);

  const { data: farmer, error: farmerError } = await supabase
    .from("farmers")
    .select("id")
    .eq("id", farmerId)
    .maybeSingle();
  if (farmerError) return serverError(farmerError.message);
  if (!farmer) return notFound("農家が見つかりません");

  const body = await request.json<{
    reviewer_name?: string;
    rating?: number;
    comment?: string;
    website?: string; // ハニーポット
  }>();

  if (body.website) {
    return json({ ok: true }, { status: 201 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return badRequest("評価は1〜5の整数で指定してください");
  }

  const id = newId("review");
  const { error } = await supabase.from("reviews").insert({
    id,
    farmer_id: farmerId,
    reviewer_name: (body.reviewer_name || "").trim() || "匿名",
    rating,
    comment: (body.comment || "").trim(),
    created_at: nowSeconds(),
  });
  if (error) return serverError(error.message);

  return json({ id }, { status: 201 });
};
