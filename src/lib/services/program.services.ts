import { createClient } from "@/lib/supabase";

const supabase = createClient();

export async function getPrograms() {
  const { data, error } = await supabase.from("program").select("*");
  if (error) throw new Error(error.message);
  return data;
}

export async function getProgramById(id: string) {
  const { data, error } = await supabase
    .from("program")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createProgram(program: Record<string, any>) {
  const { data, error } = await supabase
    .from("program")
    .insert([program])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProgram(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("program")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
