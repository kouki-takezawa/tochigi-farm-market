import { Env, json, getSupabase, serverError } from "../_lib/util";

// GET /api/jobs -> 全農家のバイト・求人を新着順に横断表示
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const supabase = getSupabase(env);

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, wage, work_date, work_hours, capacity, description, created_at, farmer_id, farmers(name, prefecture, municipality)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return serverError(error.message);

  const jobs = (data ?? []).map((j: any) => ({
    id: j.id,
    title: j.title,
    wage: j.wage,
    work_date: j.work_date,
    work_hours: j.work_hours,
    capacity: j.capacity,
    description: j.description,
    created_at: j.created_at,
    farmer_id: j.farmer_id,
    farmer_name: j.farmers?.name ?? "",
    farmer_prefecture: j.farmers?.prefecture ?? "",
    farmer_municipality: j.farmers?.municipality ?? "",
  }));

  return json({ jobs });
};
