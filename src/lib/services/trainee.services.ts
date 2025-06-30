import { createClient } from "@/lib/supabase";

const supabase = createClient();

export async function getTrainees() {
  const { data, error } = await supabase
    .from("trainee")
    .select("*")
    .order("lastname", { ascending: true });

  if (error) throw new Error(`Error fetching trainees: ${error.message}`);
  return data;
}

export async function updateTrainee(
  id: string,
  updates: Partial<{
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    originalTeam: string;
    active: boolean;
    addedBy: string;
  }>
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/trainee?id=eq.${id}`,
    {
      method: "PUT",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: `Bearer ${accessToken ?? ""}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      } as Record<string, string>,
      body: JSON.stringify(updates),
    }
  );
  return res;
}

export async function deleteTrainee(id: string) {
  const { error } = await supabase.from("trainee").delete().eq("id", id);

  if (error) throw new Error(`Error deleting trainee ${id}: ${error.message}`);
  return true;
}

export async function countActiveTrainees() {
  const { count, error } = await supabase
    .from("trainee")
    .select("*", { count: "exact", head: true }) // no data, just count
    .eq("active", true);

  if (error)
    throw new Error(`Error counting active trainees: ${error.message}`);
  return count ?? 0;
}

export async function createTrainee({
  firstname,
  lastname,
  email,
  originalTeam,
  active = true,
  addedBy,
}: {
  firstname: string;
  lastname: string;
  email: string;
  originalTeam: string;
  active?: boolean;
  addedBy: string;
}) {
  const { data, error } = await supabase
    .from("trainee")
    .insert([
      {
        firstname,
        lastname,
        email,
        originalTeam,
        active,
        addedBy,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating trainee: ${error.message}`);
  return data;
}

export async function getTraineeById(id: string) {
  const { data, error } = await supabase
    .from("trainee")
    .select(
      `
      *,
      member:addedBy (
        id,
        firstname,
        lastname,
        email,
        role
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(`Error fetching trainee ${id}: ${error.message}`);
  return data;
}

export async function getTraineeCount() {
  const { count, error } = await supabase
    .from("trainee")
    .select("*", { count: "exact", head: true }); // no data, just count

  if (error) throw new Error(`Error counting trainees: ${error.message}`);
  return count ?? 0;
}

export async function getActiveTrainees() {
  const { data, error } = await supabase
    .from("trainee")
    .select("*")
    .eq("active", true)
    .order("lastname", { ascending: true });

  if (error)
    throw new Error(`Error fetching active trainees: ${error.message}`);
  return data;
}

export async function getInactiveTrainees() {
  const { data, error } = await supabase
    .from("trainee")
    .select("*")
    .eq("active", false)
    .order("lastname", { ascending: true });

  if (error)
    throw new Error(`Error fetching inactive trainees: ${error.message}`);
  return data;
}
