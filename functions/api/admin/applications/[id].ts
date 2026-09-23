import { Env, json, badRequest, notFound, newId, nowSeconds, requireAdmin, getSupabase, serverError } from "../../../_lib/util";

// PUT /api/admin/applications/:id -> 申し込みの承認・却下(管理者のみ)
// 承認時は farmers を新規作成し、既存の運営者代行登録と同じ形で管理URLを発行する。
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const id = params.id as string;
  const body = await request.json<{ action?: "approve" | "reject"; admin_note?: string }>();
  if (body.action !== "approve" && body.action !== "reject") {
    return badRequest("action は approve か reject を指定してください");
  }

  const supabase = getSupabase(env);
  const { data: application, error: fetchError } = await supabase
    .from("farmer_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return serverError(fetchError.message);
  if (!application) return notFound("申し込みが見つかりません");
  if (application.status !== "pending") {
    return badRequest("この申し込みはすでに処理済みです");
  }

  const now = nowSeconds();

  if (body.action === "reject") {
    const { error } = await supabase
      .from("farmer_applications")
      .update({ status: "rejected", admin_note: body.admin_note ?? null, reviewed_at: now })
      .eq("id", id);
    if (error) return serverError(error.message);
    return json({ ok: true, status: "rejected" });
  }

  // 承認: farmersを作成し、管理URLを発行する
  const farmerId = newId("farmer");
  const manageToken = crypto.randomUUID();

  const { error: insertError } = await supabase.from("farmers").insert({
    id: farmerId,
    name: application.name,
    prefecture: application.prefecture,
    municipality: application.municipality,
    crops: application.crops ?? "",
    description: application.description ?? "",
    cover_image_url: null,
    line_url: application.contact_method === "line" ? application.contact_value : null,
    phone: application.contact_method === "phone" ? application.contact_value : null,
    lat: null,
    lng: null,
    manage_token: manageToken,
    created_at: now,
    updated_at: now,
  });
  if (insertError) return serverError(insertError.message);

  const { error: updateError } = await supabase
    .from("farmer_applications")
    .update({ status: "approved", admin_note: body.admin_note ?? null, reviewed_at: now })
    .eq("id", id);
  if (updateError) return serverError(updateError.message);

  return json({
    ok: true,
    status: "approved",
    farmer_id: farmerId,
    manage_token: manageToken,
    manage_url: `/post.html?farmer=${farmerId}&token=${manageToken}`,
  });
};
