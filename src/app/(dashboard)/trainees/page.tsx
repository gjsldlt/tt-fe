"use client";
import { ColumnDef, DataTable } from "@/components/data-table";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTrainee,
  deleteTrainee,
  getTrainees,
} from "@/lib/services/trainee.services";
import { Trainee } from "@/models/trainee";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useMember } from "@/app/context/member-context";
import { toast } from "sonner";
import { Delete, View } from "lucide-react";
import { redirect } from "next/navigation";

export default function ProgramsPage() {
  const { member } = useMember();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create Dialog state
  const [creating, setCreating] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openCreateConfirm, setOpenCreateConfirm] = useState(false);

  // Delete Dialog state
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    originalTeam: "",
  });

  const columns: ColumnDef<Trainee>[] = [
    {
      accessorKey: "firstname",
      header: "User",
      sortable: true,
      filterable: true,
      filterConfig: {
        type: "text",
        placeholder: "Search users...",
      },
      cell: (value, row) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {(row.firstname + " " + row.lastname)
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {row.firstname + " " + row.lastname}
            </div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "originalTeam",
      header: "Team",
      sortable: true,
      filterable: true,
      filterConfig: {
        type: "select",
        options: [
          { label: "FED", value: "FED" },
          { label: "AEM", value: "AEM" },
          { label: "UI/UX", value: "UI/UX" },
        ],
      },
    },
  ];

  const fetchTrainees = async () => {
    setIsLoading(true);
    try {
      const data = await getTrainees();
      setTrainees(data);
    } catch (error) {
      console.error("Error fetching trainees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainees();
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      if (member) {
        console.log("Creating trainee with data:", form);
        const response = await createTrainee({ ...form, addedBy: member?.id });
        await fetchTrainees(); // Refresh the list after creation
      }
    } catch (error) {
      console.error("Error creating trainee:", error);
    } finally {
      setCreating(false);
      setOpenCreateConfirm(false);
      setOpenCreateDialog(false);
      toast(`${form.firstname} ${form.lastname} is now added as a Trainee`);
      setForm({ firstname: "", lastname: "", email: "", originalTeam: "" });
    }
  };

  const toggleCreateDialog = () => {
    setForm({ firstname: "", lastname: "", email: "", originalTeam: "" });
    setOpenCreateDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedTrainee) return;
    try {
      // Call your delete service here
      await deleteTrainee(selectedTrainee.id);
      await fetchTrainees(); // Refresh the list after deletion
      toast(
        `${selectedTrainee.firstname} ${selectedTrainee.lastname} has been deleted`
      );
    } catch (error) {
      console.error("Error deleting trainee:", error);
    } finally {
      setOpenDeleteConfirm(false);
      setSelectedTrainee(null);
    }
  };

  const traineeDialog = (
    <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register new Trainee</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpenCreateConfirm(true);
          }}
          className="space-y-4"
        >
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={creating}>
              Create
            </Button>
          </DialogFooter>
        </form>
        <Dialog open={openCreateConfirm} onOpenChange={setOpenCreateConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Program Creation</DialogTitle>
            </DialogHeader>
            <div>
              <p>
                Are you sure you want to create the program
                <b>
                  {form.firstname} {form.lastname}
                </b>
                ?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenCreateConfirm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleCreate}
                disabled={creating}
              >
                Yes, Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );

  const deleteDialog = (
    <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Trainee Deletion</DialogTitle>
        </DialogHeader>
        <div>
          <p>
            Are you sure you want to delete{" "}
            <b>
              {selectedTrainee?.firstname} {selectedTrainee?.lastname}
            </b>
            ?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Yes, Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const actions = (row: Trainee) => (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setSelectedTrainee(row);
          setOpenDeleteConfirm(true);
        }}
      >
        <Delete className="h-4 w-4 mr-1" />
        Delete
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          redirect(`/trainees/${row.id}`);
        }}
      >
        <View className="h-4 w-4 mr-1" />
        View
      </Button>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen w-full">
        <div className="h-16 flex items-center justify-start align-center border-b px-4 w-full">
          <h1 className="text-2xl font-bold ">Trainees</h1>
          <div className="flex-1" />
          <Button variant="outline" onClick={toggleCreateDialog}>
            + New Trainee
          </Button>
        </div>
        <div className="flex-1 p-4 bg-muted/10">
          {trainees.length === 0 && !isLoading ? (
            <Card className="max-w-md mx-auto mt-10">
              <CardContent className="py-8 flex flex-col items-center">
                <span className="text-muted-foreground text-lg mb-2">
                  No registered trainees found.
                </span>
                <span className="text-sm text-muted-foreground mb-4">
                  create a new trainee record to get started.
                </span>
                <Button
                  variant="default"
                  className="mb-4"
                  onClick={toggleCreateDialog}
                >
                  + New Trainee
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={trainees}
              columns={columns}
              isLoading={isLoading}
              actions={actions}
              emptyMessage="No users found"
              pageSize={10}
              pageSizeOptions={[5, 10, 20]}
              searchable={true}
              searchPlaceholder="Search users by name, email, or department..."
            />
          )}
          {traineeDialog}
          {deleteDialog}
        </div>
      </div>
    </ProtectedRoute>
  );
}
