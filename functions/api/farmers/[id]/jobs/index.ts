import { Env, json, badRequest, newId, nowSeconds, requireFarmerToken, getSupabase, serverError } from "../../../../_lib/util";

// POST /api/farmers/:id/jobs -> バイト・求人を追加(要 manage_token)
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
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

  const id = newId("job");
  const now = nowSeconds();

  const { error } = await supabase.from("jobs").insert({
    id,
    farmer_id: farmerId,
    title: body.title,
    wage: body.wage,
    work_date: body.work_date ?? "",
    work_hours: body.work_hours ?? null,
    capacity: body.capacity ?? null,
    description: body.description ?? "",
    created_at: now,
  });
  if (error) return serverError(error.message);

  await supabase.from("farmers").update({ updated_at: now }).eq("id", farmerId);

  return json({ id }, { status: 201 });
};
