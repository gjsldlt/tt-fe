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
  Users,
} from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  getProgressLogsForTrainee,
} from "@/lib/services/progresslog.services";
import { useMember } from "@/app/context/member-context";
import { TimelineView } from "@/components/timeline-view";
import {
  assignProgramToTrainee,
  getActiveProgramForTrainee,
  getAllPrograms,
  getProgramAssignmentsForTrainee,
  markProgramAssignmentDone,
} from "@/lib/services/program-assignment";
import { toast } from "sonner";
import { Program } from "@/models/program";

export default function SelectedTrainee() {
  const { member } = useMember();
  const params = useParams<{ id: string }>();
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [activeProgramAssignment, setActiveProgramAssignment] =
    useState<ProgramAssignment | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [allTraineePrograms, setAllTraineePrograms] = useState<
    ProgramAssignment[]
  >([]);
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [programLoader, setProgramLoader] = useState<boolean>(false);
  // Create Dialog state
  const [creating, setCreating] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openUpdateConfirm, setOpenUpdateConfirm] = useState(false);
  // Progress Log Dialog state
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  // Program Assignment Dialog state
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [programNotes, setProgramNotes] = useState<string>("");
  const [openConfirmFinishProgram, setOpenConfirmFinishProgram] =
    useState(false);
  // Form state
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    originalTeam: "",
    active: true,
  });
  const [progressForm, setProgressForm] = useState({
    title: "",
    description: "",
  });

  const getTrainee = async (id: string) => {
    setLoading(true);
    try {
      const response = await getTraineeById(id);
      setTrainee(response as Trainee);
      const resProgressLogs = await getProgressLogsForTrainee(id);
      setProgressLogs(resProgressLogs);
      const resActiveProgram = await getActiveProgramForTrainee(id);
      setActiveProgramAssignment(resActiveProgram);
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

  const handleUpdate = async () => {
    setCreating(true);
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
      setCreating(false);
      setOpenUpdateConfirm(false);
      setOpenUpdateDialog(false);
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
      if (!activeProgram) {
        toast("Please select a program to assign", {
          description: "You must select a program to assign to the trainee.",
        });
        return;
      }
      console.log("Assigning program:", activeProgram);
      const response = await assignProgramToTrainee({
        notes: programNotes || "",
        assigned_by: member?.id || "",
        trainee_id: trainee?.id || "",
        program_id: activeProgram.id,
      });
      console.log("Program assigned successfully:", response);
      toast("Program assigned successfully", {
        description: `Program ${activeProgram.name} has been assigned to ${trainee?.firstname} ${trainee?.lastname}.`,
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

  const handleFinishProgram = () => {
    setOpenConfirmFinishProgram(true);
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
            setOpenUpdateConfirm(true);
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
        <Dialog open={openUpdateConfirm} onOpenChange={setOpenUpdateConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Trainee Detail Update</DialogTitle>
            </DialogHeader>
            <div>
              <p>
                Are you sure you want to update the details for trainee{" "}
                <b>
                  {form.firstname} {form.lastname}
                </b>
                ?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenUpdateConfirm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleUpdate}
                disabled={creating}
              >
                Yes, Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              value={activeProgram?.id || ""}
              onChange={(e) => {
                const selectedProgram = allPrograms.find(
                  (p) => p.id.toString() === e.target.value
                );
                console.log(selectedProgram, e.target.value, allPrograms);
                setActiveProgram(selectedProgram || null);
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
                    await getTrainee(params.id);
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

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen w-full">
        <div className="h-16 flex items-center justify-start border-b px-4 w-full">
          <h1 className="text-2xl font-bold">Member</h1>
          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
          <h1 className="text-2xl font-bold">
            {trainee?.firstname} {trainee?.lastname}
          </h1>
        </div>
        <div className="flex-1 p-4 bg-muted/10 flex grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex-1 flex-col">
            <Card>
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
                    {!activeProgramAssignment && (
                      <Button
                        onClick={handleAssignProgram}
                        variant="outline"
                        className="w-50 flex items-center justify-space-around"
                      >
                        {programLoader ? (
                          <CircleDotDashed className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Book className="h-4 w-4 mr-2" />
                        )}
                        Assign Program
                      </Button>
                    )}
                    {activeProgramAssignment && (
                      <Button
                        onClick={handleFinishProgram}
                        variant="outline"
                        className="w-50 flex items-center justify-space-around"
                      >
                        {programLoader ? (
                          <CircleDotDashed className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <BookCheck className="h-4 w-4 mr-2" />
                        )}
                        Finish Program
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex-1 flex-col">
            <Card className="h-full p-6 flex">
              <div className="flex-1 h-full overflow-auto">
                {trainee && (
                  <TimelineView
                    trainee={trainee}
                    dataLogs={progressLogs}
                    dataAssignments={allTraineePrograms}
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
    </ProtectedRoute>
  );
}
