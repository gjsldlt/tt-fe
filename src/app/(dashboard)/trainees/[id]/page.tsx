"use client";
import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTraineeById, updateTrainee } from "@/lib/services/trainee.services";
import {
  ProgramAssignment,
  ProgressLog,
  Trainee,
  TraineeAuditLog,
} from "@/models/trainee";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Book,
  BookCheck,
  Calendar,
  ChevronRight,
  CircleDotDashed,
  Edit,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Trash,
  User,
  Users,
} from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createProgressLog,
  deleteProgressLog,
  getProgressLogsForTrainee,
} from "@/lib/services/progresslog.services";
import { useMember } from "@/app/context/member-context";
import { TimelineView } from "@/components/timeline-view";
import {
  assignProgramToTrainee,
  deleteProgramAssignment,
  getActiveProgramForTrainee,
  getAllPrograms,
  getProgramAssignmentsForTrainee,
  markProgramAssignmentDone,
} from "@/lib/services/program-assignment";
import { toast } from "sonner";
import { Program } from "@/models/program";
import { DialogProps } from "@/models/etc";
import { getAuditLogsForTrainee } from "@/lib/services/trainee-audit-log";
import RichTextEditor from "@/components/rte";
import { useTopbar } from "@/app/context/topbar-context";

export default function SelectedTrainee() {
  const { member } = useMember();
  const params = useParams<{ id: string }>();
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [tempProgram, setTempProgram] = useState<Program | null>(null);
  const [activeProgramAssignment, setActiveProgramAssignment] =
    useState<ProgramAssignment | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [allTraineePrograms, setAllTraineePrograms] = useState<
    ProgramAssignment[]
  >([]);
  const [allTraineeAuditLogs, setAllTraineeAuditLogs] = useState<
    TraineeAuditLog[]
  >([]);
  const { setTopbar } = useTopbar();

  const [programNotes, setProgramNotes] = useState<string>("");
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [programLoader, setProgramLoader] = useState<boolean>(false);
  // Create Dialog state
  const [creating, setCreating] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  // Dialog states
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [openConfirmFinishProgram, setOpenConfirmFinishProgram] =
    useState(false);

  // Dialog variables
  const DIALOG_DEFAULTS = {
    isOpen: false,
    onClose: () => {},
    title: "",
    children: null,
    footer: null,
  };
  const [dialogData, setDialogData] = useState<DialogProps>(DIALOG_DEFAULTS);
  const [showStats, setShowStats] = useState(false);

  // Create timeline events and sort by date
  const daysJoined = useMemo(() => {
    if (trainee === null) return 0;
    const joinDate = new Date(trainee.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  }, [trainee]);

  // Form state
  const PROGRESS_FORM_DEFAULT = {
    title: "",
    description: "",
    programId: activeProgramAssignment ? activeProgramAssignment.id : undefined,
  };
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    originalTeam: "",
    active: true,
  });
  const [progressForm, setProgressForm] = useState<{
    title: string;
    description: string;
    programId: string | undefined;
  }>(PROGRESS_FORM_DEFAULT);

  // Function to fetch trainee data by ID
  // This function is called when the component mounts or when the trainee ID changes
  // It fetches the trainee details, progress logs, active program assignment, and all trainee programs
  // It also sets the form state for updating the trainee profile
  // and initializes the progress form for adding new progress logs
  const getTrainee = async (id: string) => {
    setLoading(true);
    try {
      const resTrainee = await getTraineeById(id);
      setTrainee(resTrainee as Trainee);
      const resProgressLogs = await getProgressLogsForTrainee(id);
      setProgressLogs(resProgressLogs);
      const resActiveProgram = await getActiveProgramForTrainee(id);
      setActiveProgramAssignment(resActiveProgram);
      if (resActiveProgram) {
        setActiveProgram(resActiveProgram.program || null);
        setProgressForm({
          title: "",
          description: "",
          programId: resActiveProgram ? resActiveProgram.id : undefined,
        });
      }
      const resTraineePrograms = await getProgramAssignmentsForTrainee(id);
      setAllTraineePrograms(resTraineePrograms);

      const resTraineeAuditLogs = await getAuditLogsForTrainee(id);
      setAllTraineeAuditLogs(resTraineeAuditLogs);
    } catch (error) {
      console.error("Error fetching trainee:", error);
      setTrainee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      getTrainee(params.id);
    }
    return () => {
      setTopbar(null); // Clear topbar when component unmounts
    };
  }, [params.id, setTopbar]);

  useEffect(() => {
    setTopbar(
      <div className="h-16 flex items-center justify-start px-4 w-full">
        <Button
          variant="ghost"
          className="text-lg"
          onClick={() => redirect("/trainees")}
        >
          Trainees
        </Button>
        <ChevronRight className="h-4 w-4 mr-4" />
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">
            {trainee?.firstname} {trainee?.lastname}
          </span>
        </div>
        <div className="flex-1"></div>
        {/* Desktop Stats */}
        <div className="hidden md:flex items-center gap-4 mr-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Days</span>
              <span className="text-base font-bold text-blue-600">
                {daysJoined}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Logs</span>
              <span className="text-base font-bold text-green-600">
                {progressLogs.length}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground">Programs</span>
              <span className="text-base font-bold text-purple-600">
                {allTraineePrograms.filter((a) => a.done_at !== null).length}/
                {allTraineePrograms.length}
              </span>
            </div>
          </div>
        </div>
        {/* Mobile More Button */}
        <div className="md:hidden mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStats((v) => !v)}
            aria-label="Show stats"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          {showStats && (
            <div className="absolute right-4 top-16 z-50 bg-background border rounded-lg shadow-lg p-4 flex gap-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Days</span>
                <span className="text-base font-bold text-blue-600">
                  {daysJoined}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Logs</span>
                <span className="text-base font-bold text-green-600">
                  {progressLogs.length}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Programs</span>
                <span className="text-base font-bold text-purple-600">
                  {allTraineePrograms.filter((a) => a.done_at !== null).length}/
                  {allTraineePrograms.length}
                </span>
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => getTrainee(params.id)}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="animate-spin h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }, [
    params.id,
    trainee,
    setTopbar,
    loading,
    daysJoined,
    progressLogs.length,
    allTraineePrograms,
    showStats, // add showStats to dependencies
  ]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateTraineeProfile = async () => {
    setLoading(true);
    try {
      if (trainee) {
        await updateTrainee(
          params.id,
          trainee,
          {
            ...form,
            id: trainee?.id || "",
            addedBy: trainee?.addedBy || "",
          },
          member?.id || ""
        );
        await getTrainee(params.id);
      }
    } catch (error) {
      console.error("Error creating trainee:", error);
    } finally {
      setLoading(false);
      setOpenUpdateDialog(false);
      setDialogData(DIALOG_DEFAULTS);
    }
  };

  const handleOpenUpdateDialog = () => {
    if (trainee) {
      setForm({
        firstname: trainee.firstname,
        lastname: trainee.lastname,
        email: trainee.email,
        originalTeam: trainee.originalTeam,
        active: trainee.active,
      });
    }
    setOpenUpdateDialog(true);
  };

  const handleProgressLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // You can call a service function to create the progress log
      await createProgressLog({
        created_by: member?.id || "",
        traineeId: trainee?.id || "",
        title: progressForm.title,
        description: progressForm.description,
        programAssignmentId: progressForm.programId,
      });

      await getTrainee(params.id);

      // After successful submission, you can close the dialog and refresh the trainee data
      setOpenProgressDialog(false);
      // Optionally, you can fetch the updated trainee data to reflect the new progress log
      await getTrainee(params.id);
    } catch (error) {
      console.error("Error submitting progress log:", error);
    } finally {
      setCreating(false);
      setOpenProgressDialog(false);
      setProgressForm({
        title: "",
        description: "",
        programId: activeProgramAssignment
          ? activeProgramAssignment.id
          : undefined,
      });
    }
  };

  const handleAssignProgram = async () => {
    setProgramLoader(true);
    try {
      // Fetch all programs to assign
      const response = await getAllPrograms();
      setAllPrograms(response);
      setOpenProgramDialog(true);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast("Error fetching programs", {
        description: "Please try again later.",
      });
    } finally {
      setProgramLoader(false);
    }

    // Open the program assignment dialog
  };

  const handleSubmitAssignProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!tempProgram) {
        toast("Please select a program to assign", {
          description: "You must select a program to assign to the trainee.",
        });
        return;
      }
      await assignProgramToTrainee({
        notes: programNotes || "",
        assigned_by: member?.id || "",
        trainee_id: trainee?.id || "",
        program_id: tempProgram.id,
      });
      toast("Program assigned successfully", {
        description: `Program ${tempProgram.name} has been assigned to ${trainee?.firstname} ${trainee?.lastname}.`,
      });
    } catch (error) {
      console.error("Error assigning program:", error);
      toast("Error assigning program", {
        description: "Please try again later.",
      });
    } finally {
      setProgramNotes("");
      setOpenProgramDialog(false);
      setActiveProgram(null);
      await getTrainee(params.id);
    }
  };

  const traineeDialog = (
    <Dialog open={openUpdateDialog} onOpenChange={setOpenUpdateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Updating {trainee?.firstname} {trainee?.lastname}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateTrainee();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-3" htmlFor="firstname">
                First Name
              </Label>
              <Input
                id="firstname"
                name="firstname"
                value={form.firstname}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <Label className="mb-3" htmlFor="lastname">
                Last Name
              </Label>
              <Input
                id="lastname"
                name="lastname"
                value={form.lastname}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-3" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <Label className="mb-3" htmlFor="originalTeam">
                Original Team
              </Label>
              <Input
                id="originalTeam"
                name="originalTeam"
                value={form.originalTeam}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>
          <div>
            <Label className="mb-3" htmlFor="active">
              Active
            </Label>
            <Switch
              onCheckedChange={(checked: boolean) =>
                setForm((prev) => ({ ...prev, active: checked }))
              }
              id="active"
              name="active"
              checked={form.active}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={creating}>
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const progressDialog = (
    <Dialog open={openProgressDialog} onOpenChange={setOpenProgressDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Progress Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleProgressLogSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter progress log details"
              required
              onChange={(e) =>
                setProgressForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Label htmlFor="title">Description</Label>
            {/* <Textarea
              id="title"
              name="title"
              placeholder="Enter progress log details"
              required
            /> */}
            <RichTextEditor
              value={progressForm.description}
              onChange={(e) =>
                setProgressForm((prev) => ({
                  ...prev,
                  description: e,
                }))
              }
              placeholder="Describe the trainee's progress, achievements, areas for improvement, and any observations..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button type="submit">Add Progress Log</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const programDialog = (
    <Dialog open={openProgramDialog} onOpenChange={setOpenProgramDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmitAssignProgram} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Label htmlFor="program">Select Program</Label>
            <select
              id="program"
              name="program"
              className="border rounded px-3 py-2"
              required
              value={tempProgram?.id || ""}
              onChange={(e) => {
                const selectedProgram = allPrograms.find(
                  (p) => p.id.toString() === e.target.value
                );
                setTempProgram(selectedProgram || null);
                // You may want to set a state for selected program here
                // setSelectedProgram(selectedProgram);
              }}
            >
              <option value="" disabled>
                Select a program to assign
              </option>
              {allPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Label htmlFor="notes">Notes</Label>
            {/* <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes here"
              value={programNotes || ""}
              onChange={(e) => setProgramNotes(e.target.value)}
            /> */}
            <RichTextEditor
              value={programNotes || ""}
              onChange={(e) => setProgramNotes(e)}
              placeholder="Note what the trainee will be doing in this program, any specific goals, or other relevant information."
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button type="submit">Assign Program</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const finishProgramDialog = (
    <Dialog
      open={openConfirmFinishProgram}
      onOpenChange={setOpenConfirmFinishProgram}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Finish Program</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Are you sure you want to finish the program{" "}
            <b>{activeProgram?.name}</b> for trainee{" "}
            <b>
              {trainee?.firstname} {trainee?.lastname}
            </b>
            ?
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setOpenConfirmFinishProgram(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setOpenConfirmFinishProgram(false);
                setProgramLoader(true);
                try {
                  if (activeProgramAssignment) {
                    // Call the service to finish the program
                    await markProgramAssignmentDone(
                      trainee?.id || "",
                      activeProgramAssignment
                    );
                    toast("Program finished successfully", {
                      description: `Program ${activeProgram?.name} has been finished for ${trainee?.firstname} ${trainee?.lastname}.`,
                    });
                    setActiveProgramAssignment(null);
                    setActiveProgram(null);
                  }
                } catch (error) {
                  console.error("Error finishing program:", error);
                  toast("Error finishing program", {
                    description: "Please try again later.",
                  });
                } finally {
                  await getTrainee(params.id);
                  setProgramLoader(false);
                }
              }}
            >
              Yes, Finish Program
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );

  const handleClearProgramAssignment = async () => {
    setDialogData({
      isOpen: true,
      onClose: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      title: "Confirm Delete Program Assignment",
      children: (
        <div className="space-y-4">
          <p>
            Are you sure you want to delete the program assignment for{" "}
            <b>
              {trainee?.firstname} {trainee?.lastname}
            </b>
            ?
          </p>
          <p>
            This action cannot be undone and will remove the program assignment
            from the trainee.
          </p>
        </div>
      ),
      footer: (
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() =>
              setDialogData((prev) => ({ ...prev, isOpen: false }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              setDialogData((prev) => ({ ...prev, isOpen: false }));
              setProgramLoader(true);
              try {
                if (activeProgramAssignment) {
                  await deleteProgramAssignment(activeProgramAssignment.id);
                  setActiveProgramAssignment(null);
                  setActiveProgram(null);
                  toast("Program assignment deleted successfully", {
                    description: "The program assignment has been deleted.",
                  });
                  await getTrainee(params.id);
                }
              } catch (error) {
                console.error("Error deleting program assignment:", error);
                toast("Error deleting program assignment", {
                  description: "Please try again later.",
                });
              } finally {
                setProgramLoader(false);
                setActiveProgramAssignment(null);
                setActiveProgram(null);
              }
            }}
          >
            Yes, Delete Assignment
          </Button>
        </DialogFooter>
      ),
    });
  };

  const handleUpdateTrainee = async () => {
    setDialogData({
      isOpen: true,
      onClose: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      title: "Confirm Update Trainee",
      children: (
        <div className="space-y-4">
          <p>
            Are you sure you want to update the trainee{" "}
            <b>
              {form.firstname} {form.lastname}
            </b>
            ?
          </p>
          <p>
            This action will update the trainee&apos;s details with the provided
            information.
          </p>
        </div>
      ),
      footer: (
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() =>
              setDialogData((prev) => ({ ...prev, isOpen: false }))
            }
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleUpdateTraineeProfile}
            disabled={loading}
          >
            {loading ? "Updating..." : "Yes, Update Trainee"}
          </Button>
        </DialogFooter>
      ),
    });
  };

  const customDialog = (
    <Dialog open={dialogData.isOpen} onOpenChange={dialogData.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogData.title}</DialogTitle>
        </DialogHeader>
        {dialogData.children}
        {dialogData.footer && <DialogFooter>{dialogData.footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );

  const handleDeleteProgressLog = (logId: string): void => {
    setDialogData({
      isOpen: true,
      onClose: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      title: "Confirm Delete Progress Log",
      children: (
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this progress log? This action
            cannot be undone.
          </p>
        </div>
      ),
      footer: (
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() =>
              setDialogData((prev) => ({ ...prev, isOpen: false }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              setDialogData((prev) => ({ ...prev, isOpen: false }));
              try {
                // Call the service to delete the progress log
                await deleteProgressLog(logId || "");
              } catch (error) {
                console.error("Error deleting progress log:", error);
                toast("Error deleting progress log", {
                  description: "Please try again later.",
                });
              } finally {
                // Refresh the trainee data to reflect the deletion
                await getTrainee(params.id);
              }
            }}
          >
            Yes, Delete Log
          </Button>
        </DialogFooter>
      ),
    });
  };

  const handleDeleteProgramAssignment = (
    assignmentId: string | undefined
  ): void => {
    setDialogData({
      isOpen: true,
      onClose: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      title: "Confirm Delete Program Assignment",
      children: (
        <div className="space-y-4">
          <p>
            Are you sure you want to delete this program assignment? This action
            cannot be undone.
          </p>
        </div>
      ),
      footer: (
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() =>
              setDialogData((prev) => ({ ...prev, isOpen: false }))
            }
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              setDialogData((prev) => ({ ...prev, isOpen: false }));
              try {
                // Call the service to delete the program assignment
                if (assignmentId) {
                  await deleteProgramAssignment(assignmentId);
                  setActiveProgramAssignment(null);
                  setActiveProgram(null);
                  toast("Program assignment deleted successfully", {
                    description: "The program assignment has been deleted.",
                  });
                }
              } catch (error) {
                console.error("Error deleting program assignment:", error);
                toast("Error deleting program assignment", {
                  description: "Please try again later.",
                });
              } finally {
                // Refresh the trainee data to reflect the deletion
                await getTrainee(params.id);
              }
            }}
          >
            Yes, Delete Assignment
          </Button>
        </DialogFooter>
      ),
    });
  };

  const handleDescriptionChange = useCallback((value: string) => {
    setProgressForm((prev) => ({
      ...prev,
      description: value,
    }));
  }, []);

  // Place conditional return AFTER all hooks
  if (trainee === null && !loading) {
    redirect("/trainees");
    return null;
  }

  const profileColumn = (
    <>
      {/* Profile Card */}
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">
                  {getInitials(
                    trainee?.firstname || "",
                    trainee?.lastname || ""
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold break-words">
                    {trainee?.firstname} {trainee?.lastname}
                  </h1>
                  <Badge variant={trainee?.active ? "default" : "secondary"}>
                    {trainee?.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="break-all">{trainee?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{trainee?.originalTeam}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined{" "}
                      {new Date(
                        trainee?.created_at || new Date()
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleOpenUpdateDialog}
                variant="outline"
                className="w-full sm:w-50 flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {trainee?.active ? (
        <>
          {/* Assigned Program Card */}
          <Card>
            <CardContent>
              {activeProgram ? (
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <BookCheck className="h-4 w-4" />
                      <span className="text-lg font-semibold break-words">
                        Active Program: {activeProgram.name}
                      </span>
                    </div>
                    <div className="text-sm mb-4 break-words">
                      {activeProgram.description}
                    </div>
                    <div className="text-sm flex flex-col sm:flex-row text-muted-foreground gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Assigned on{" "}
                          {new Date(
                            activeProgramAssignment?.created_at || new Date()
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="break-words">
                          Assigned by:{" "}
                          {`${activeProgramAssignment?.assignedBy?.firstname} ${activeProgramAssignment?.assignedBy?.lastname}` ||
                            "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleClearProgramAssignment}
                      className="w-full sm:w-auto"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete assignment
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setOpenConfirmFinishProgram(true)}
                      className="w-full sm:w-auto"
                    >
                      <BookCheck className="h-4 w-4 mr-2" />
                      Finish Program
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span>Not assigned in any program</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleAssignProgram}
                    disabled={programLoader}
                    className="w-full sm:w-auto"
                  >
                    {programLoader ? (
                      <CircleDotDashed className="h-4 w-4" />
                    ) : (
                      <Book className="h-4 w-4 mr-2" />
                    )}
                    {programLoader ? "Loading..." : "Assign Program"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Quick Progress Log Form Card */}
          <Card className="flex-1 flex">
            <CardContent className="flex-1 flex flex-col justify-stretch">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProgressLogSubmit(e);
                }}
                className="space-y-4 flex flex-col h-full justify-stretch"
              >
                <div className="grid grid-cols-1 gap-4">
                  <Label htmlFor="title">Quick Progress Log</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter progress log title"
                    required
                    value={progressForm.title}
                    onChange={(e) =>
                      setProgressForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 justify-stretch">
                  <div>
                    <Label htmlFor="description">Description</Label>
                  </div>
                  <div className="flex-1">
                    <RichTextEditor
                      value={progressForm.description}
                      onChange={handleDescriptionChange}
                      placeholder="Describe the trainee's progress, achievements, areas for improvement, and any observations..."
                    />
                  </div>
                </div>
                {/* form clear and submit */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end">
                  {activeProgram && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="airplane-mode"
                        checked={progressForm.programId !== undefined}
                        onCheckedChange={(checked: boolean) =>
                          setProgressForm((prev) => ({
                            ...prev,
                            programId: checked
                              ? activeProgramAssignment?.id
                              : undefined,
                          }))
                        }
                      />
                      <Label htmlFor="airplane-mode">
                        Related to {activeProgram.name}
                      </Label>
                    </div>
                  )}
                  <div className="flex-1" />
                  <Button
                    disabled={creating}
                    className="w-full sm:w-auto"
                    variant="outline"
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:w-auto"
                  >
                    {creating ? "Creating..." : "Add Progress Log"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Trainee is Inactive. No progress logs or program assignments can
              be added.
            </p>
            <p className="text-sm text-muted-foreground">
              Please activate the trainee to enable progress tracking.
            </p>
            <p className="text-sm text-muted-foreground">
              You can edit the trainee profile to activate them.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Stats Card */}
      {/* <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {daysJoined}
              </div>
              <div className="text-sm text-muted-foreground">
                Days since joining
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {progressLogs.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Progress logs recorded
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {allTraineePrograms.filter((a) => a.done_at !== null).length}/
                {allTraineePrograms.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Programs completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </>
  );

  const timelineColumn = (
    <Card className="flex-1 flex flex-col min-h-0">
      {" "}
      {/* min-h-0 is important for flex children */}
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {" "}
        {/* Remove extra padding */}
        {trainee && (
          <TimelineView
            trainee={trainee}
            dataLogs={progressLogs}
            dataAssignments={allTraineePrograms}
            traineeAuditLogs={allTraineeAuditLogs}
            deleteProgressLog={handleDeleteProgressLog}
            deleteProgramAssignment={handleDeleteProgramAssignment}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <div className="flex-1 min-h-full w-full sm:p-4 bg-muted/10 flex justify-stretch flex-col xl:flex-row gap-4">
        {/* Profile Column */}
        <div className="flex-1 flex flex-col items-stretch gap-4 ">
          {profileColumn}
        </div>
        {/* Timeline  */}
        <div className="flex-1 flex flex-col ">{timelineColumn}</div>
      </div>
      {traineeDialog}
      {progressDialog}
      {programDialog}
      {finishProgramDialog}
      {customDialog}
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-white">
            <RefreshCw className="animate-spin" />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
