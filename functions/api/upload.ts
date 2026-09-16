import { Env, json, badRequest, requireFarmerToken, getSupabase } from "../_lib/util";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

// POST /api/upload  (multipart/form-data: file, farmer_id, ヘッダー x-manage-token)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.IMAGES) {
    return json({ error: "画像アップロードは準備中です。しばらくお待ちください(写真なしでも投稿できます)。" }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const farmerId = form.get("farmer_id");
  const token = request.headers.get("x-manage-token");

  if (!(file instanceof File) || typeof farmerId !== "string") {
    return badRequest("file と farmer_id は必須です");
  }

  const supabase = getSupabase(env);
  const auth = await requireFarmerToken(supabase, farmerId, token);
  if (!auth.ok) return auth.response;

  if (!ALLOWED_TYPES.has(file.type)) {
    return badRequest("対応していない画像形式です(jpeg/png/webp/gif)");
  }
  if (file.size > MAX_BYTES) {
    return badRequest("画像サイズは8MB以下にしてください");
  }

  const ext = file.type.split("/")[1];
  const key = `${farmerId}/${crypto.randomUUID()}.${ext}`;

  await env.IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ url: `/images/${key}` }, { status: 201 });
};
