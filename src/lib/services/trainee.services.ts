import { createClient } from "@/lib/supabase";
import { Program } from "@/models/program";
import { createTraineeAuditLog } from "./trainee-audit-log";
import { Member } from "@/models/member";

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

  // add buddy for each trainee
  const traineesWithBuddies = await Promise.all(
    traineesWithPrograms.map(async (trainee) => {
      const { data: buddyData, error: buddyError } = await supabase
        .from("traineebuddy")
        .select(`buddy_id, buddy:buddy_id(id, firstname, lastname, email)`)
        .eq("trainee_id", trainee.id)
        .single();
      if (buddyError?.code === "PGRST116" || buddyError?.code === "PGRST101") {
        // No buddy assigned, return trainee with null buddy
        return { ...trainee, buddy: null };
      }
      return {
        ...trainee,
        buddy: buddyData?.buddy as unknown as {
          id: string;
          firstname: string;
          lastname: string;
          email: string;
        } | null,
      };
    })
  );

  return traineesWithBuddies;
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
    buddy?: Member; // <-- add buddy to type
  }>,
  updates: Partial<{
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    originalTeam: string;
    active: boolean;
    addedBy: string;
    buddy?: Member; // <-- add buddy to type
  }>,
  updatedBy: string
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  // Extract buddy from updates if present
  const { buddy, ...traineeUpdates } = updates;

  // Update trainee fields (excluding buddy)
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
      body: JSON.stringify(traineeUpdates),
    }
  );

  // Track changes for audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changes: Record<string, { old: any; new: any }> = {};

  // Compare trainee fields
  for (const key in traineeUpdates) {
    if (Object.prototype.hasOwnProperty.call(traineeUpdates, key)) {
      if (
        old[key as keyof typeof old] !==
        traineeUpdates[key as keyof typeof traineeUpdates]
      ) {
        changes[key] = {
          old: old[key as keyof typeof old],
          new: traineeUpdates[key as keyof typeof traineeUpdates],
        };
      }
    }
  }

  // Handle buddy update
  let buddyChanged = false;
  if (typeof buddy !== "undefined") {
    // Fetch current buddy
    const { data: currentBuddyData } = await supabase
      .from("traineebuddy")
      .select("buddy_id,id")
      .eq("trainee_id", id)
      .single();

    const currentBuddyId = currentBuddyData?.buddy_id || null;
    const currentBuddyRowId = currentBuddyData?.id || null;

    if (!!!buddy) {
      // Remove buddy if exists
      if (currentBuddyId) {
        await supabase
          .from("traineebuddy")
          .delete()
          .eq("trainee_id", id)
          .eq("buddy_id", currentBuddyId);
        changes["buddy"] = {
          old: `${old.buddy?.firstname} ${old.buddy?.lastname}`,
          new: "None",
        };
        buddyChanged = true;
      }
    } else if (buddy !== currentBuddyId) {
      if (currentBuddyId) {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/traineebuddy?id=eq.${currentBuddyRowId}`,
          {
            method: "PUT",
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
              Authorization: `Bearer ${accessToken ?? ""}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            } as Record<string, string>,
            body: JSON.stringify({
              buddy_id: buddy.id,
              trainee_id: id,
              id: currentBuddyRowId,
            }),
          }
        );
        changes["buddy"] = {
          old: `${old.buddy?.firstname} ${old.buddy?.lastname}`,
          new: `${buddy.firstname} ${buddy.lastname}`,
        };
      } else {
        // Add new buddy
        await supabase
          .from("traineebuddy")
          .insert([{ trainee_id: id, buddy_id: buddy.id }]);
        changes["buddy"] = {
          old: "None",
          new: `${buddy.firstname} ${buddy.lastname}`,
        };
      }
      buddyChanged = true;
    }
  }

  // Only create audit log if there are changes or buddy was changed
  if (res.ok && (Object.keys(changes).length > 0 || buddyChanged)) {
    await createTraineeAuditLog({
      trainee_id: id,
      updated_by: updatedBy || "",
      changes,
      note: "Trainee updated",
    });
  } else if (!res.ok) {
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
      ),
      buddy:traineebuddy!trainee_id (
        buddy_id,
        buddy:buddy_id (
          id,
          firstname,
          lastname,
          email
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(`Error fetching trainee ${id}: ${error.message}`);

  // Flatten buddy info for easier consumption (optional)
  let buddy = null;
  if (data?.buddy && data.buddy.length > 0) {
    buddy = data.buddy[0].buddy;
  }

  return {
    ...data,
    buddy,
  };
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

// Get the buddy (member) for a given trainee id
export async function getBuddyForTrainee(traineeId: string) {
  const { data, error } = await supabase
    .from("traineebuddy")
    .select(
      `
        *,
        member:buddy_id (
          id,
          firstname,
          lastname,
          email,
          role
        )
      `
    )
    .eq("trainee_id", traineeId)
    .single();

  if (error)
    throw new Error(`Error fetching buddy for trainee: ${error.message}`);
  return data;
}

// Get all trainees for which a member is a buddy
export async function getBuddiesOfMember(memberId: string) {
  const { data, error } = await supabase
    .from("traineebuddy")
    .select(
      `
        *,
        trainee:trainee_id (
          id,
          firstname,
          lastname,
          email,
          originalTeam,
          active
        )
      `
    )
    .eq("buddy_id", memberId);

  if (error)
    throw new Error(`Error fetching buddies of member: ${error.message}`);
  return data;
}

// Update buddy for a given trainee (change buddy_id for a trainee_id)
export async function updateBuddyOfTrainee(
  traineeId: string,
  newBuddyId: string
) {
  const { data, error } = await supabase
    .from("traineebuddy")
    .update({ buddy_id: newBuddyId })
    .eq("trainee_id", traineeId)
    .select()
    .single();

  if (error)
    throw new Error(`Error updating buddy for trainee: ${error.message}`);
  return data;
}

// Delete buddy row by trainee_id and buddy_id
export async function deleteBuddyByTraineeAndBuddy(
  traineeId: string,
  buddyId: string
) {
  const { error } = await supabase
    .from("traineebuddy")
    .delete()
    .eq("trainee_id", traineeId)
    .eq("buddy_id", buddyId);

  if (error)
    throw new Error(
      `Error deleting buddy by trainee and buddy: ${error.message}`
    );
  return true;
}

// Delete buddy row by id
export async function deleteBuddyById(id: number) {
  const { error } = await supabase.from("traineebuddy").delete().eq("id", id);

  if (error) throw new Error(`Error deleting buddy by id: ${error.message}`);
  return true;
}

// Add a buddy row via trainee_id and member_id (buddy_id)
export async function addBuddyForTrainee(traineeId: string, buddyId: string) {
  const { data, error } = await supabase
    .from("traineebuddy")
    .insert([{ trainee_id: traineeId, buddy_id: buddyId }])
    .select()
    .single();

  if (error)
    throw new Error(`Error adding buddy for trainee: ${error.message}`);
  return data;
}
