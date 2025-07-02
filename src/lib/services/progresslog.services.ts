import { createClient } from "@/lib/supabase";

const supabase = createClient();

// Get all logs for a specific trainee
export async function getProgressLogsForTrainee(traineeId: string) {
  const { data, error } = await supabase
    .from("progresslog")
    .select(
      `
            *,
            created_by:member(*),
            traineeId:trainee(*),
            programAssignment:programAssignmentId(*,program:program_id(*))
        `
    )
    .eq("traineeId", traineeId)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`Error fetching logs for trainee: ${error.message}`);
  return data;
}

// Get all logs created by a member
export async function getProgressLogsByMember(memberId: string) {
  const { data, error } = await supabase
    .from("progresslog")
    .select("*")
    .eq("created_by", memberId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error fetching logs by member: ${error.message}`);
  return data;
}

// Create a new log for a trainee
export async function createProgressLog({
  created_by,
  traineeId,
  title,
  description,
  programAssignmentId,
  created_at = new Date().toISOString(),
}: {
  created_by: string;
  traineeId: string;
  title: string;
  description: string;
  programAssignmentId: string | undefined;
  created_at?: string; // Optional, defaults to current date
}) {
  const { data, error } = await supabase
    .from("progresslog")
    .insert([
      {
        created_by,
        traineeId,
        title,
        description,
        programAssignmentId,
        created_at,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Error creating progress log: ${error.message}`);
  return data;
}

// Update a log for a trainee
export async function updateProgressLog(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
  }>
) {
  if (Object.keys(updates).length === 0) {
    throw new Error("No fields provided to update.");
  }

  const { data, error } = await supabase
    .from("progresslog")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error updating progress log: ${error.message}`);
  return data;
}

// Delete a log for a trainee
export async function deleteProgressLog(id: string) {
  const { error } = await supabase.from("progresslog").delete().eq("id", id);

  if (error) throw new Error(`Error deleting progress log: ${error.message}`);
  return true;
}

// Count total logs for a specific trainee
export async function countProgressLogsForTrainee(traineeId: string) {
  const { count, error } = await supabase
    .from("progresslog")
    .select("*", { count: "exact", head: true }) // only return count
    .eq("traineeId", traineeId);

  if (error)
    throw new Error(`Error counting logs for trainee: ${error.message}`);
  return count ?? 0;
}
