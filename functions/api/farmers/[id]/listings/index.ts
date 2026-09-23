import { Env, json, badRequest, newId, nowSeconds, requireFarmerToken, getSupabase, serverError } from "../../../../_lib/util";

// POST /api/farmers/:id/listings -> 出品を追加(要 manage_token)
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const farmerId = params.id as string;
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

  const id = newId("listing");
  const now = nowSeconds();

  const { error } = await supabase.from("listings").insert({
    id,
    farmer_id: farmerId,
    image_url: body.image_url ?? null,
    title: body.title,
    comment: body.comment ?? "",
    price: body.price ?? null,
    is_special: !!body.is_special,
    ships_available: !!body.ships_available,
    created_at: now,
  });
  if (error) return serverError(error.message);

  await supabase.from("farmers").update({ updated_at: now }).eq("id", farmerId);

  return json({ id }, { status: 201 });
};
