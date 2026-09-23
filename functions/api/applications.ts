import { Env, json, badRequest, newId, nowSeconds, getSupabase, serverError } from "../_lib/util";

// POST /api/applications -> 農家によるセルフ掲載申し込み(公開・認証不要)。
// 運営者が内容を確認し、承認したら /api/admin/applications/:id で farmers に登録される。
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{
    name?: string;
    prefecture?: string;
    municipality?: string;
    crops?: string;
    description?: string;
    contact_method?: string;
    contact_value?: string;
    website?: string; // ハニーポット。人間の利用者には見えない項目で、埋まっていればbotとみなす
  }>();

  // スパム対策のハニーポット: 見えない項目が埋まっていれば、成功したフリをして黙って捨てる
  if (body.website) {
    return json({ ok: true }, { status: 201 });
  }

  if (!body.name || !body.prefecture || !body.municipality) {
    return badRequest("農家名と都道府県と市町村は必須です");
  }
  const contactMethod = body.contact_method;
  if (contactMethod !== "line" && contactMethod !== "phone" && contactMethod !== "email") {
    return badRequest("連絡方法(LINE/電話/メール)を選んでください");
  }
  if (!body.contact_value) {
    return badRequest("連絡先を入力してください");
  }

  const id = newId("application");
  const supabase = getSupabase(env);

  const { error } = await supabase.from("farmer_applications").insert({
    id,
    name: body.name,
    prefecture: body.prefecture,
    municipality: body.municipality,
    crops: body.crops ?? "",
    description: body.description ?? "",
    contact_method: contactMethod,
    contact_value: body.contact_value,
    status: "pending",
    created_at: nowSeconds(),
  });

  if (error) return serverError(error.message);

  return json({ id }, { status: 201 });
};
