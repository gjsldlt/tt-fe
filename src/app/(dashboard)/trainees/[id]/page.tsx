"use client";
import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTraineeById, updateTrainee } from "@/lib/services/trainee.services";
import { ProgramAssignment, ProgressLog, Trainee } from "@/models/trainee";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Book,
  BookCheck,
  Calendar,
  ChevronRight,
  CircleDotDashed,
  Edit,
  Mail,
  RefreshCw,
  Trash,
  User,
  Users,
} from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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

  const getTrainee = async (id: string) => {
    setLoading(true);
    try {
      const response = await getTraineeById(id);
      setTrainee(response as Trainee);
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
  }, [params.id]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  if (trainee === null && !loading) {
    redirect("/trainees");
    return null;
  }

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
      console.log("Updating trainee with data:", form);
      await updateTrainee(params.id, {
        ...form,
        id: trainee?.id || "",
        addedBy: trainee?.addedBy || "",
      });
      await getTrainee(params.id);
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

  const handleOpenProgressDialog = () => {
    if (trainee) {
      setProgressForm({
        title: "",
        description: "",
        programId: activeProgramAssignment
          ? activeProgramAssignment.id
          : undefined,
      });
    }
    setOpenProgressDialog(true);
  };

  const handleProgressLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Handle progress log submission here
      console.log("Submitting progress log:", progressForm);
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
      console.log("Assigning program:", tempProgram);
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
            <Textarea
              id="title"
              name="title"
              placeholder="Enter progress log details"
              onChange={(e) =>
                setProgressForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              required
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
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes here"
              value={programNotes || ""}
              onChange={(e) => setProgramNotes(e.target.value)}
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

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen w-full">
        <div className="h-16 flex items-center justify-start border-b px-4 w-full">
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
          {/* Refresh button */}
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
        <div className="flex-1 p-4 bg-muted/10 flex flex-col xl:flex-row gap-4 ">
          {/* Profile Column */}
          <div className="flex-1 flex-col flex items-stretch">
            {/* Profile Card */}
            <Card className="">
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-lg ">
                        {getInitials(
                          trainee?.firstname || "",
                          trainee?.lastname || ""
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold">
                          {trainee?.firstname} {trainee?.lastname}
                        </h1>
                        <Badge
                          variant={trainee?.active ? "default" : "secondary"}
                        >
                          {trainee?.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{trainee?.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{trainee?.originalTeam}</span>
                        </div>
                        <div className="flex items-center space-x-2">
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
                      className="w-50 flex items-center justify-space-around"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={handleOpenProgressDialog}
                      variant="outline"
                      className="w-50 flex items-center justify-space-around"
                    >
                      <CircleDotDashed className="h-4 w-4 mr-2" />
                      Add Progress Log
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Assigned Program Card */}
            <Card className=" mt-4">
              <CardContent>
                {activeProgram ? (
                  <div className="space-y-2 flex flex-row items-start justify-between">
                    <div className="flex flex-col space-x-2">
                      <div className="flex items-center space-x-2">
                        <BookCheck className="h-4 w-4" />
                        <span className="text-lg font-semibold">
                          Active Program: {activeProgram.name}
                        </span>
                      </div>
                      <div className="text-sm mb-4">
                        {activeProgram.description}
                      </div>
                      <div className="text-sm flex flex-row text-muted-foreground space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Assigned on{" "}
                            {new Date(
                              activeProgramAssignment?.created_at || new Date()
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>
                            Assigned by:{" "}
                            {`${activeProgramAssignment?.assignedBy?.firstname} ${activeProgramAssignment?.assignedBy?.lastname}` ||
                              "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-end space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => handleClearProgramAssignment()}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete assignment
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          setOpenConfirmFinishProgram(true);
                        }}
                      >
                        <BookCheck className="h-4 w-4 mr-2" />
                        Finish Program
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground flex justify-center items-space-between ">
                    <div className="flex items-center space-x-2">
                      <span>Not assigned in any program</span>
                    </div>
                    <div className="flex-1"></div>
                    <Button
                      variant="outline"
                      onClick={handleAssignProgram}
                      disabled={programLoader}
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
            <Card className="flex flex-1 mt-4">
              <CardContent className="flex flex-1 flex-col">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProgressLogSubmit(e);
                  }}
                  className="space-y-4 flex flex-1 flex-col"
                >
                  <div className="flex-0 grid grid-cols-1 gap-4">
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
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-0">
                      <Label htmlFor="description">Description</Label>
                    </div>
                    <div className="flex flex-1">
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Enter progress log description"
                        value={progressForm.description}
                        required
                        onChange={(e) =>
                          setProgressForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  {/* form clear and submit */}
                  <div className="flex-0 flex flex-row space-x-4 justify-end">
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
                      className="w-full flex-0 "
                      variant="outline"
                    >
                      Clear
                    </Button>

                    <Button
                      type="submit"
                      disabled={creating}
                      className="w-full flex-0 "
                    >
                      {creating ? "Creating..." : "Add Progress Log"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            {/* Stats Card */}
            <Card className=" mt-4">
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
                      {
                        allTraineePrograms.filter((a) => a.done_at !== null)
                          .length
                      }
                      /{allTraineePrograms.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Programs completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Timeline  */}
          <div className="flex-1 flex-col">
            <Card className="h-full p-6 flex">
              <div className="flex-1 h-full overflow-auto">
                {trainee && (
                  <TimelineView
                    trainee={trainee}
                    dataLogs={progressLogs}
                    dataAssignments={allTraineePrograms}
                    deleteProgressLog={handleDeleteProgressLog}
                    deleteProgramAssignment={handleDeleteProgramAssignment}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
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
