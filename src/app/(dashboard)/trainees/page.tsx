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
import { useEffect, useMemo, useState } from "react";
import { useMember } from "@/app/context/member-context";
import { toast } from "sonner";
import { Delete, MoreVertical, RefreshCw, View } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTopbar } from "@/app/context/topbar-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TraineesPage() {
  const { member } = useMember();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [teams, setTeams] = useState<string[]>(["FED", "AEM", "UI/UX"]);
  const { setTopbar } = useTopbar();

  // Column variables for DataTable
  const defaultColumns: ColumnDef<Trainee>[] = useMemo(
    () => [
      {
        accessorKey: "firstname",
        header: "User",
        sortable: true,
        filterable: false,
        filterConfig: {
          type: "text",
          placeholder: "Search users...",
        },
        cell: (value, row) => (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {(
                  row.firstname.replaceAll(" ", "") +
                  " " +
                  row.lastname.replaceAll(" ", "")
                )
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
      // column for active status
      {
        accessorKey: "active",
        header: "Status",
        sortable: true,
        filterable: true,
        filterConfig: {
          type: "select",
          options: [
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ],
          defaultValue: "true",
          getValue: (row) => String(row.active),
        },
        cell: (value, row) => (
          <div className="text-sm">
            <Badge variant={row.active ? "default" : "secondary"}>
              {row.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        ),
      },
      // column for program
      {
        accessorKey: "program",
        header: "Program",
        sortable: true,
        filterable: true,
        filterConfig: {
          type: "select",
          options: trainees
            .map((trainee) => trainee.program)
            .filter((name, index, self) => name && self.indexOf(name) === index)
            .map((name) => ({
              value: name || "",
              label: name || "No program assigned",
            })),
        },
        cell: (value, row) => (
          <div className="text-sm text-muted-foreground">
            {row.program || "No program assigned"}
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
          // get options from trainees unique originalTeams
          options: teams.map((team) => ({
            value: team,
            label: team,
          })),
        },
      },
    ],
    [teams, trainees]
  );
  const [columns, setColumns] = useState<ColumnDef<Trainee>[]>(defaultColumns);

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

  const fetchTrainees = async () => {
    setIsLoading(true);
    try {
      const data = await getTrainees();
      setTrainees(data);
      const tempTeams = data
        .map((trainee) => trainee.originalTeam)
        // Remove duplicates
        .filter((team, index, self) => self.indexOf(team) === index);
      setTeams(tempTeams);
      setColumns((prev) => {
        return prev.map((col) => {
          if (col.accessorKey === "program") {
            return {
              ...col,
              filterConfig: {
                type: "select",
                options: data
                  .map((trainee) => trainee.program)
                  .filter(
                    (name, index, self) => name && self.indexOf(name) === index
                  )
                  .map((name) => ({
                    value: name || "",
                    label: name || "No program assigned",
                  })),
              },
            };
          }
          if (col.accessorKey === "originalTeam") {
            return {
              ...col,
              filterConfig: {
                type: "select",
                options: tempTeams.map((team) => ({
                  value: team,
                  label: team,
                })),
              },
            };
          }
          return col;
        });
      });
    } catch (error) {
      console.error("Error fetching trainees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainees();
    setTopbar(
      <>
        <h1 className="text-2xl font-bold">Trainees</h1>
        <div className="flex-1" />
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="ml-4"
            onClick={fetchTrainees}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={toggleCreateDialog}>
            + New Trainee
          </Button>
        </div>
      </>
    );
    return () => {
      setTopbar(null); // Clear the topbar when component unmounts
    };
  }, [setTopbar]);

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
        await createTrainee({ ...form, addedBy: member?.id });
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
      toast.error(
        `Error deleting trainee: ${selectedTrainee.firstname} ${selectedTrainee.lastname}`
      );
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
      {/* Mobile: show separate buttons */}
      <div className="flex md:hidden space-x-2">
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
      {/* Desktop: show dropdown menu */}
      <div className="hidden md:flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                redirect(`/trainees/${row.id}`);
              }}
            >
              <View className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedTrainee(row);
                setOpenDeleteConfirm(true);
              }}
            >
              <Delete className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col max-w-full h-full w-full overflow-auto">
        <div className="flex-1 p-4 bg-muted/10">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : trainees.length === 0 ? (
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
              maxHeight="75vh"
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
