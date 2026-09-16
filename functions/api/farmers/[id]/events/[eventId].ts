import { Env, json, badRequest, notFound, requireFarmerToken, getSupabase, serverError } from "../../../../_lib/util";

// PUT /api/farmers/:id/events/:eventId -> イベント/人手募集を編集(要 manage_token)
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const eventId = params.eventId as string;
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

  const { data, error } = await supabase
    .from("events")
    .update({
      kind: body.kind === "labor" ? "labor" : "event",
      title: body.title,
      event_date: body.event_date,
      event_time: body.event_time ?? null,
      location: body.location ?? "",
      description: body.description ?? "",
      fee: body.fee ?? null,
    })
    .eq("id", eventId)
    .eq("farmer_id", farmerId)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("イベントが見つかりません");

  return json({ ok: true });
};

// DELETE /api/farmers/:id/events/:eventId -> イベント/人手募集を削除(要 manage_token)
export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const eventId = params.eventId as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("farmer_id", farmerId)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("イベントが見つかりません");

  return json({ ok: true });
};
