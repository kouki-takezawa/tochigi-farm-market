import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Env {
  IMAGES: R2Bucket;
  ADMIN_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export function getSupabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(message: string): Response {
  return json({ error: message }, { status: 400 });
}

export function unauthorized(message = "manage_token が正しくありません"): Response {
  return json({ error: message }, { status: 401 });
}

export function notFound(message = "見つかりません"): Response {
  return json({ error: message }, { status: 404 });
}

export function serverError(message: string): Response {
  return json({ error: message }, { status: 500 });
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function requireFarmerToken(
  supabase: SupabaseClient,
  farmerId: string,
  token: string | null
): Promise<{ ok: true } | { ok: false; response: Response }> {
  if (!token) {
    return { ok: false, response: unauthorized("manage_token が必要です") };
  }
  const { data, error } = await supabase
    .from("farmers")
    .select("id")
    .eq("id", farmerId)
    .eq("manage_token", token)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, response: unauthorized() };
  }
  return { ok: true };
}

export function requireAdmin(request: Request, env: Env): boolean {
  const header = request.headers.get("x-admin-secret");
  return !!env.ADMIN_SECRET && header === env.ADMIN_SECRET;
}
