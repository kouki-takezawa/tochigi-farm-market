import { Env, json, getSupabase, serverError } from "../_lib/util";

// GET /api/listings -> 全農家の出品を新着順に横断表示(仕様書 3-3)
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const supabase = getSupabase(env);

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, image_url, title, comment, price, is_special, ships_available, created_at, farmer_id, farmers(name, prefecture, municipality, lat, lng)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return serverError(error.message);

  const listings = (data ?? []).map((l: any) => ({
    id: l.id,
    image_url: l.image_url,
    title: l.title,
    comment: l.comment,
    price: l.price,
    is_special: l.is_special,
    ships_available: l.ships_available,
    created_at: l.created_at,
    farmer_id: l.farmer_id,
    farmer_name: l.farmers?.name ?? "",
    farmer_prefecture: l.farmers?.prefecture ?? "",
    farmer_municipality: l.farmers?.municipality ?? "",
    farmer_lat: l.farmers?.lat ?? null,
    farmer_lng: l.farmers?.lng ?? null,
  }));

  return json({ listings });
};
