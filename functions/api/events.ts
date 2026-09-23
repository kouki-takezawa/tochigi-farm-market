import { Env, json, getSupabase, serverError } from "../_lib/util";

// GET /api/events -> 全農家のイベントを日付順に横断表示(仕様書 3-4)。開催予定(本日以降)のみ
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const supabase = getSupabase(env);
  const todayDateStr = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, kind, title, event_date, event_time, location, description, fee, created_at, farmer_id, farmers(name, prefecture, municipality)"
    )
    .gte("event_date", todayDateStr)
    .order("event_date", { ascending: true })
    .limit(200);

  if (error) return serverError(error.message);

  const events = (data ?? []).map((e: any) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    event_date: e.event_date,
    event_time: e.event_time,
    location: e.location,
    description: e.description,
    fee: e.fee,
    created_at: e.created_at,
    farmer_id: e.farmer_id,
    farmer_name: e.farmers?.name ?? "",
    farmer_prefecture: e.farmers?.prefecture ?? "",
    farmer_municipality: e.farmers?.municipality ?? "",
  }));

  return json({ events });
};
