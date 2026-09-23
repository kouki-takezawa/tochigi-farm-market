import { Env, json, requireAdmin, getSupabase, serverError } from "../../../_lib/util";

// GET /api/admin/applications?status=pending -> 掲載申し込み一覧(管理者のみ)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const supabase = getSupabase(env);

  let query = supabase
    .from("farmer_applications")
    .select("id, name, prefecture, municipality, crops, description, contact_method, contact_value, status, admin_note, created_at, reviewed_at")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return serverError(error.message);

  return json({ applications: data ?? [] });
};
