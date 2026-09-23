import { Env, json, badRequest, notFound, requireFarmerToken, getSupabase, serverError } from "../../../../_lib/util";

// PUT /api/farmers/:id/listings/:listingId -> 出品を編集(要 manage_token)
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const listingId = params.listingId as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  const body = await request.json<{
    title?: string;
    comment?: string;
    price?: number | null;
    is_special?: boolean;
    ships_available?: boolean;
    image_url?: string | null;
  }>();

  if (!body.title) {
    return badRequest("title は必須です");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({
      title: body.title,
      comment: body.comment ?? "",
      price: body.price ?? null,
      is_special: !!body.is_special,
      ships_available: !!body.ships_available,
      image_url: body.image_url ?? null,
    })
    .eq("id", listingId)
    .eq("farmer_id", farmerId)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("出品が見つかりません");

  return json({ ok: true });
};

// DELETE /api/farmers/:id/listings/:listingId -> 出品を削除(要 manage_token)
export const onRequestDelete: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
  const listingId = params.listingId as string;
  const token = request.headers.get("x-manage-token");
  const supabase = getSupabase(env);

  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("farmer_id", farmerId)
    .select("id");

  if (error) return serverError(error.message);
  if (!data || data.length === 0) return notFound("出品が見つかりません");

  return json({ ok: true });
};
