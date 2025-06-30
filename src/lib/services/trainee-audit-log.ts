import { createClient } from "@/lib/supabase";

const supabase = createClient();

// ✅ Create an audit log entry
export async function createTraineeAuditLog({
  trainee_id,
  updated_by,
  changes,
  note,
}: {
  trainee_id: string;
  updated_by: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes: Record<string, { old: any; new: any }>;
  note?: string;
}) {
  const { data, error } = await supabase
    .from("traineeAuditLog")
    .insert({ trainee_id, updated_by, changes, note })
    .select()
    .single();

  if (error) throw new Error(`Error creating audit log: ${error.message}`);
  return data;
}

// ✅ Delete an audit log entry by ID
export async function deleteTraineeAuditLog(id: string) {
  const { error } = await supabase
    .from("traineeAuditLog")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Error deleting audit log: ${error.message}`);
  return true;
}

// ✅ Get all audit logs for a specific trainee
export async function getAuditLogsForTrainee(trainee_id: string) {
  const { data, error } = await supabase
    .from("traineeAuditLog")
    .select(
      `
      *,
      updatedBy:updated_by (
        id,
        firstname,
        lastname,
        role
      )
    `
    )
    .eq("trainee_id", trainee_id)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`Error fetching trainee audit logs: ${error.message}`);
  return data;
}

// ✅ Get all audit logs created by a specific member
export async function getAuditLogsByMember(member_id: string) {
  const { data, error } = await supabase
    .from("traineeAuditLog")
    .select(
      `
      *,
      trainee:trainee_id (
        id,
        firstname,
        lastname,
        email
      )
    `
    )
    .eq("updated_by", member_id)
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(`Error fetching member audit logs: ${error.message}`);
  return data;
}
