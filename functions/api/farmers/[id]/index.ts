import { Env, json, badRequest, notFound, requireFarmerToken, nowSeconds, getSupabase, serverError } from "../../../_lib/util";

// GET /api/farmers/:id -> 農家詳細 + 出品一覧 + イベント一覧
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;
  const supabase = getSupabase(env);

  const { data: farmer, error: farmerError } = await supabase
    .from("farmers")
    .select("id, name, municipality, crops, description, cover_image_url, line_url, phone, lat, lng, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (farmerError) return serverError(farmerError.message);
  if (!farmer) return notFound("農家が見つかりません");

  const [
    { data: listings, error: listingsError },
    { data: events, error: eventsError },
    { data: jobs, error: jobsError },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("id, image_url, title, comment, price, is_special, created_at")
      .eq("farmer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, kind, title, event_date, event_time, location, description, fee, created_at")
      .eq("farmer_id", id)
      .order("event_date", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, title, wage, work_date, work_hours, capacity, description, created_at")
      .eq("farmer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (listingsError) return serverError(listingsError.message);
  if (eventsError) return serverError(eventsError.message);
  if (jobsError) return serverError(jobsError.message);

  return json({ farmer, listings: listings ?? [], events: events ?? [], jobs: jobs ?? [] });
};

// PUT /api/farmers/:id -> プロフィール編集(要 manage_token)
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  const id = params.id as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, id, token);
  if (!auth.ok) return auth.response;

  const body = await request.json<{
    name?: string;
    municipality?: string;
    crops?: string;
    description?: string;
    cover_image_url?: string;
    line_url?: string;
    phone?: string;
  }>();

  if (!body.name || !body.municipality) {
    return badRequest("name と municipality は必須です");
  }

  const { error } = await supabase
    .from("farmers")
    .update({
      name: body.name,
      municipality: body.municipality,
      crops: body.crops ?? "",
      description: body.description ?? "",
      cover_image_url: body.cover_image_url ?? null,
      line_url: body.line_url ?? null,
      phone: body.phone ?? null,
      updated_at: nowSeconds(),
    })
    .eq("id", id);

  if (error) return serverError(error.message);

  return json({ ok: true });
};
