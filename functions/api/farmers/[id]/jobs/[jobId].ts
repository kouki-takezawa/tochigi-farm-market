import { Env, json, badRequest, notFound, requireFarmerToken, getSupabase, serverError } from "../../../../_lib/util";

// PUT /api/farmers/:id/jobs/:jobId -> バイト・求人を編集(要 manage_token)
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const jobId = params.jobId as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  const body = await request.json<{
    title?: string;
    wage?: string;
    work_date?: string;
    work_hours?: string | null;
    capacity?: string | null;
    description?: string;
  }>();

  if (!body.title || !body.wage) {
    return badRequest("title と wage は必須です");
  }

  const { data, error } = await supabase
    .from("jobs")
    .update({
      title: body.title,
      wage: body.wage,
      work_date: body.work_date ?? "",
      work_hours: body.work_hours ?? null,
      capacity: body.capacity ?? null,
      description: body.description ?? "",
    })
    .eq("id", jobId)
    .eq("farmer_id", farmerId)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("求人が見つかりません");

  return json({ ok: true });
};

// DELETE /api/farmers/:id/jobs/:jobId -> バイト・求人を削除(要 manage_token)
export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const jobId = params.jobId as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase.from("jobs").delete().eq("id", jobId).eq("farmer_id", farmerId).select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("求人が見つかりません");

  return json({ ok: true });
};
