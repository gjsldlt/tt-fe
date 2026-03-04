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
        `,
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
  }>,
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

/**
 * 🔥 Paginated progress logs with optional trainee/member filter for dashboard.
 */
export async function getProgressLogsPaginated(
  page: number = 1,
  pageSize: number = 10,
  traineeId?: string,
  memberId?: string,
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("progresslog")
    .select(
      `*, created_by:member(*), traineeId:trainee(*), programAssignment:programAssignmentId(*,program:program_id(*))`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (traineeId) {
    query = query.eq("traineeId", traineeId);
  }
  if (memberId) {
    query = query.eq("created_by", memberId);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(`Error fetching paginated logs: ${error.message}`);
  return { data: data || [], count: count ?? 0 };
}

/**
 * 🔥 Get all buddies, their active trainee count, and progress log counts
 * within a date range. Used to identify members who haven't submitted logs.
 */
export async function getMemberProgressLogActivity(
  startDate: string,
  endDate: string,
) {
  // Step 1: Get all buddy assignments with trainee active status
  const { data: buddyRows, error: buddyError } = await supabase
    .from("traineebuddy")
    .select(
      `buddy_id, buddy:buddy_id(id, firstname, lastname, email), trainee:trainee_id(id, active)`,
    );

  if (buddyError)
    throw new Error(`Error fetching buddies: ${buddyError.message}`);

  // Build a map: buddy_id → { member info, activeTraineeCount }
  const buddyMap = new Map<
    string,
    {
      member: {
        id: string;
        firstname: string;
        lastname: string;
        email: string;
      };
      activeTraineeCount: number;
    }
  >();

  for (const row of buddyRows || []) {
    if (!row.buddy) continue;
    const member = row.buddy as unknown as {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
    };
    const trainee = row.trainee as unknown as {
      id: string;
      active: boolean;
    } | null;
    const existing = buddyMap.get(row.buddy_id);
    const isActive = trainee?.active === true ? 1 : 0;

    if (existing) {
      existing.activeTraineeCount += isActive;
    } else {
      buddyMap.set(row.buddy_id, { member, activeTraineeCount: isActive });
    }
  }

  // Step 2: For each buddy, count progress logs in date range
  const results = await Promise.all(
    Array.from(buddyMap.entries()).map(
      async ([buddyId, { member, activeTraineeCount }]) => {
        const { count, error } = await supabase
          .from("progresslog")
          .select("*", { count: "exact", head: true })
          .eq("created_by", buddyId)
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (error) return { member, logCount: 0, activeTraineeCount };
        return { member, logCount: count ?? 0, activeTraineeCount };
      },
    ),
  );

  return results;
}
