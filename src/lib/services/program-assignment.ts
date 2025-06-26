import { createClient } from "@/lib/supabase";
import { ProgramAssignment } from "@/models/trainee";

const supabase = createClient();

// Assign program to trainee (create a new assignment)
export async function assignProgramToTrainee({
  notes,
  assigned_by,
  trainee_id,
  program_id,
}: {
  notes?: string;
  assigned_by: string;
  trainee_id: string;
  program_id: string;
}) {
  const { data, error } = await supabase
    .from("programassignment")
    .insert([
      {
        notes,
        assigned_by,
        trainee_id,
        program_id,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error assigning program: ${error.message}`);
  return data;
}

// Delete a program assignment
export async function deleteProgramAssignment(id: string) {
  const { error } = await supabase
    .from("programassignment")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Error deleting assignment: ${error.message}`);
  return true;
}

// Mark a program assignment as done
export async function markProgramAssignmentDone(
  id: string,
  activeProgram: ProgramAssignment
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  console.log({
    ...activeProgram,
    done_at: new Date().toISOString(),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/programassignment?id=eq.${activeProgram.id}`,
    {
      method: "PUT",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: `Bearer ${accessToken ?? ""}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      } as Record<string, string>,
      body: JSON.stringify({
        ...activeProgram,
        done_at: new Date().toISOString(),
      }),
    }
  );
  return res;
}

export async function getActiveProgramForTrainee(trainee_id: string) {
  const { data, error } = await supabase
    .from("programassignment")
    .select("*")
    .eq("trainee_id", trainee_id)
    .is("done_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error?.code === "PGRST116") {
    // No active program found
    return null;
  }

  if (error) throw new Error(`Error fetching active program: ${error.message}`);
  return data;
}

export async function getAllPrograms() {
  const { data, error } = await supabase
    .from("program")
    .select("*")
    .order("created_at", { ascending: false }); // optional: order by newest first

  if (error) throw new Error(`Error fetching programs: ${error.message}`);
  return data;
}

export async function getProgramAssignmentsForTrainee(trainee_id: string) {
  const { data, error } = await supabase
    .from("programassignment")
    .select(`*, program:program_id(*), assignedBy:assigned_by(*)`)
    .eq("trainee_id", trainee_id)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`Error fetching program assignments: ${error.message}`);
  return data;
}
