import { createClient } from "@/lib/supabase";

const supabase = createClient();

export async function getMembers() {
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .neq("role", "admin")
    .order("lastname", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getMemberByAuthUserId(authUserId: string) {
  const { data, error } = await supabase
    .from("member")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateMember(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("member")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMember(member: Record<string, any>) {
  const { data, error } = await supabase
    .from("member")
    .insert([member])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
