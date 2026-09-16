import { Env, json, badRequest, newId, nowSeconds, requireAdmin, getSupabase, serverError } from "../../_lib/util";

// GET /api/farmers?municipality=宇都宮市 -> 農家一覧(カード用データ)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const municipality = url.searchParams.get("municipality");
  const supabase = getSupabase(env);

  let query = supabase
    .from("farmers")
    .select("id, name, municipality, crops, description, cover_image_url, line_url, phone, lat, lng, updated_at")
    .order("updated_at", { ascending: false });

  if (municipality) {
    query = query.eq("municipality", municipality);
  }

  const { data: farmers, error } = await query;
  if (error) return serverError(error.message);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartSec = Math.floor(todayStart.getTime() / 1000);
  const todayDateStr = new Date().toISOString().slice(0, 10);

  const enriched = await Promise.all(
    (farmers ?? []).map(async (f) => {
      const [{ data: listingToday }, { data: nextEvent }] = await Promise.all([
        supabase
          .from("listings")
          .select("id")
          .eq("farmer_id", f.id)
          .gte("created_at", todayStartSec)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("events")
          .select("event_date")
          .eq("farmer_id", f.id)
          .gte("event_date", todayDateStr)
          .order("event_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        ...f,
        has_listing_today: !!listingToday,
        next_event_date: nextEvent?.event_date ?? null,
      };
    })
  );

  return json({ farmers: enriched });
};

// POST /api/farmers  (運営者による農家登録。x-admin-secret ヘッダー必須)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAdmin(request, env)) {
    return json({ error: "管理者のみ実行できます" }, { status: 403 });
  }

  const body = await request.json<{
    name?: string;
    municipality?: string;
    crops?: string;
    description?: string;
    cover_image_url?: string;
    line_url?: string;
    phone?: string;
    lat?: number | null;
    lng?: number | null;
  }>();

  if (!body.name || !body.municipality) {
    return badRequest("name と municipality は必須です");
  }

  const id = newId("farmer");
  const manageToken = crypto.randomUUID();
  const now = nowSeconds();
  const supabase = getSupabase(env);

  const { error } = await supabase.from("farmers").insert({
    id,
    name: body.name,
    municipality: body.municipality,
    crops: body.crops ?? "",
    description: body.description ?? "",
    cover_image_url: body.cover_image_url ?? null,
    line_url: body.line_url ?? null,
    phone: body.phone ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    manage_token: manageToken,
    created_at: now,
    updated_at: now,
  });

  if (error) return serverError(error.message);

  return json(
    {
      id,
      manage_token: manageToken,
      manage_url: `/post.html?farmer=${id}&token=${manageToken}`,
    },
    { status: 201 }
  );
};
