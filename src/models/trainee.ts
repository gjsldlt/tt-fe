import { Member } from "./member";
import { Program } from "./program";

export type Trainee = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  originalTeam: string;
  active: boolean;
  addedBy: string; // memberId
  created_at: string; // ISO date string
  program?: string;
  member?: Member;
};

export type ProgressLog = {
  id: string;
  title: string;
  created_by: Member;
  description: string;
  traineeId: Trainee;
  created_at: string;
  programAssignmentId?: string; // Optional field to link to a program assignment
  programAssignment?: ProgramAssignment; // Optional field to link to a program assignment
};

export type ProgramAssignment = {
  id: string;
  created_at: string;
  notes: string;
  assigned_by: string;
  trainee_id: string;
  program_id: string;
  done_at: string | null;
  program?: Program;
  assignedBy?: Member;
};

export type TraineeAuditLog = {
  id: string;
  trainee_id: string;
  changes: string | JSON; // JSON string of changes
  note: string;
  updated_by: string; // memberId
  created_at: string; // ISO date string
  trainee?: Trainee; // Optional field to link to the trainee
  updatedBy?: Member; // Optional field to link to the member who made the changes
};
export type TraineeAuditChanges = {
  [field: string]: {
    old: string | number | boolean | null;
    new: string | number | boolean | null;
  };
};
