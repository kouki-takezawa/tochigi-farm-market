import { Env, json, badRequest, notFound, requireAdmin, getSupabase, serverError } from "../../../_lib/util";

// GET /api/admin/farmers/:id -> 管理用URLの再発行(管理者のみ。紛失時の再取得用)
export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const id = params.id as string;
  const supabase = getSupabase(env);

  const { data, error } = await supabase.from("farmers").select("id, name, manage_token").eq("id", id).maybeSingle();

  if (error) return serverError(error.message);
  if (!data) return notFound("農家が見つかりません");

  return json({
    id: data.id,
    name: data.name,
    manage_token: data.manage_token,
    manage_url: `/post.html?farmer=${data.id}&token=${data.manage_token}`,
  });
};

// PUT /api/admin/farmers/:id -> 緯度経度など位置情報の修正(管理者のみ)
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const id = params.id as string;
  const body = await request.json<{ lat?: number | null; lng?: number | null }>();

  if (body.lat == null || body.lng == null) {
    return badRequest("lat と lng は必須です");
  }

  const supabase = getSupabase(env);
  const { data, error } = await supabase.from("farmers").update({ lat: body.lat, lng: body.lng }).eq("id", id).select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("農家が見つかりません");

  return json({ ok: true });
};

// DELETE /api/admin/farmers/:id -> 農家を削除(管理者のみ。出品・イベントも連鎖削除)
export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const id = params.id as string;
  const supabase = getSupabase(env);

  const { data, error } = await supabase.from("farmers").delete().eq("id", id).select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("農家が見つかりません");

  return json({ ok: true });
};
