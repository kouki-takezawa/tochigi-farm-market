import { Env, json, badRequest, newId, nowSeconds, requireFarmerToken, getSupabase, serverError } from "../../../../_lib/util";

// POST /api/farmers/:id/events -> イベント/人手募集を追加(要 manage_token)
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  const body = await request.json<{
    kind?: "event" | "labor";
    title?: string;
    event_date?: string;
    event_time?: string | null;
    location?: string;
    description?: string;
    fee?: string | null;
  }>();

  if (!body.title || !body.event_date) {
    return badRequest("title と event_date は必須です");
  }

  const id = newId("event");
  const now = nowSeconds();

  const { error } = await supabase.from("events").insert({
    id,
    farmer_id: farmerId,
    kind: body.kind === "labor" ? "labor" : "event",
    title: body.title,
    event_date: body.event_date,
    event_time: body.event_time ?? null,
    location: body.location ?? "",
    description: body.description ?? "",
    fee: body.fee ?? null,
    created_at: now,
  });
  if (error) return serverError(error.message);

  await supabase.from("farmers").update({ updated_at: now }).eq("id", farmerId);

  return json({ id }, { status: 201 });
};
