import { Env, json, notFound, requireAdmin, getSupabase, serverError } from "../../../_lib/util";

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
