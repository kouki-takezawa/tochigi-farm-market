import { Env } from "../_lib/util";

// GET /images/:farmerId/:filename -> R2に保存した画像を配信
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  if (!env.IMAGES) {
    return new Response("Not Found", { status: 404 });
  }

  const parts = params.key as string[]; // catch-all [[key]] からのパス配列
  const key = parts.join("/");

  const object = await env.IMAGES.get(key);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
};
