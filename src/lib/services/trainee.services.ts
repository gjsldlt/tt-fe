import { createClient } from "@/lib/supabase";
import { Program } from "@/models/program";
import { createTraineeAuditLog } from "./trainee-audit-log";

const supabase = createClient();

export async function getTrainees() {
  const { data, error } = await supabase
    .from("trainee")
    .select("*")
    .order("lastname", { ascending: true });

  if (error) throw new Error(`Error fetching trainees: ${error.message}`);

  // add program for each trainee
  const traineesWithPrograms = await Promise.all(
    data.map(async (trainee) => {
      const { data: programData, error: programError } = await supabase
        .from("programassignment")
        .select("program_id, program:program_id(*)")
        .eq("trainee_id", trainee.id)
        .is("done_at", null)
        // Only get active assignments
        .single();

      if (
        programError?.code === "PGRST116" ||
        programError?.code === "PGRST101"
      ) {
        // No program assigned, return trainee with null program
        return { ...trainee, program: null };
      }

      return {
        ...trainee,
        program: (programData?.program as unknown as Program).name,
      };
    })
  );

  return traineesWithPrograms;
}
export async function updateTrainee(
  id: string,
  old: Partial<{
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    originalTeam: string;
    active: boolean;
    addedBy: string;
  }>,
  updates: Partial<{
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    originalTeam: string;
    active: boolean;
    addedBy: string;
  }>,
  updatedBy: string
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

  // create a new trainee audit log entry
  if (res.ok) {
    // Fetch the previous trainee data to construct the changes object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changes: Record<string, { old: any; new: any }> = {};
    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        if (
          old[key as keyof typeof old] !== updates[key as keyof typeof updates]
        ) {
          changes[key] = {
            old: old[key as keyof typeof old],
            new: updates[key as keyof typeof updates],
          };
        }
      }
    }
    await createTraineeAuditLog({
      trainee_id: id,
      updated_by: updatedBy || "",
      changes,
      note: "Trainee updated",
    });
  } else {
    const errorData = await res.json();
    throw new Error(
      `Error updating trainee ${id}: ${errorData.message || res.statusText}`
    );
  }
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

// Get all unique Original Teams
export async function getUniqueOriginalTeams() {
  const { data, error } = await supabase
    .from("trainee")
    .select("originalTeam", { count: "exact", head: true })
    .neq("originalTeam", null)
    .order("originalTeam", { ascending: true });

  if (error) throw new Error(`Error fetching original teams: ${error.message}`);
  return data.map((item) => item.originalTeam).filter(Boolean);
}
