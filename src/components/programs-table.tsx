"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUser } from "@/app/context/user-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Program = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created_by: string; // memberId
};

export function ProgramsTable() {
  const user = useUser();
  const supabase = createClient();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    tags: "",
  });
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "view" | "update">(
    "create"
  );

  // Store which program is being viewed
  const [viewedProgramId, setViewedProgramId] = useState<string | null>(null);

  // Filter state
  const [filterName, setFilterName] = useState("");
  const [filterTag, setFilterTag] = useState("");

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data, error } = await supabase.from("program").select("*");
      if (error) {
        toast.error("Failed to load programs");
      } else {
        setPrograms(data);
      }
      setLoading(false);
    };
    fetchPrograms();
  }, [supabase]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Open dialog for creating a new program
  const openCreateDialog = () => {
    setForm({ name: "", description: "", tags: "" });
    setViewMode("create");
    setViewedProgramId(null);
    setOpenDialog(true);
  };

  // Open dialog for updating a program (pre-fill form)
  const openUpdateDialog = (program: Program) => {
    setForm({
      name: program.name,
      description: program.description,
      tags: program.tags.join(", "),
    });
    setViewMode("update");
    setViewedProgramId(program.id);
    setOpenDialog(true);
  };

  const handleCreate = async () => {
    setCreating(true);
    const tagsArray = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    // Optionally, get the current user/member for created_by
    let created_by = null;
    if (user && user.id) {
      const { data: memberData } = await supabase
        .from("member")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      created_by = memberData?.id ?? null;
    }

    const { error, data } = await supabase
      .from("program")
      .insert([
        {
          name: form.name,
          description: form.description,
          tags: tagsArray,
          memberId: created_by,
        },
      ])
      .select();

    if (error) {
      toast.error(`Failed to create program: ${error.message}`);
    } else {
      toast.success("Program created!");
      setPrograms((prev) => [...prev, ...(data ?? [])]);
      setForm({ name: "", description: "", tags: "" });
      setOpenDialog(false);
    }
    setCreating(false);
    setOpenConfirm(false);
  };

  // Update handler
  const handleUpdate = async () => {
    if (!viewedProgramId) return;
    setCreating(true);
    const tagsArray = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const updates = {
      name: form.name,
      description: form.description,
      tags: tagsArray,
      id: viewedProgramId,
      updated_at: new Date().toISOString(),
    };

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/program?id=eq.${viewedProgramId}`,
        {
          method: "PUT",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
            Authorization: `Bearer ${accessToken ?? ""}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          } as Record<string, string>,
          body: JSON.stringify(updates),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(
          `Error updating program: ${errorData.message || res.statusText}`
        );
      } else {
        toast.success("Program updated!");
        // Update local state
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === viewedProgramId ? { ...p, ...updates, tags: tagsArray } : p
          )
        );
        setOpenDialog(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error updating program: ${errorMessage}`);
    }
    setCreating(false);
    setOpenConfirm(false);
  };

  // Filtered programs
  const filteredPrograms = programs.filter((program) => {
    const nameMatch = program.name
      .toLowerCase()
      .includes(filterName.toLowerCase());
    const tagMatch =
      !filterTag ||
      program.tags.some((tag) =>
        tag.toLowerCase().includes(filterTag.toLowerCase())
      );
    return nameMatch && tagMatch;
  });

  // Dialog for creating or updating a program
  const programDialog = (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {viewMode === "create" ? "Create a new program" : "Update Program"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (viewMode === "create") setOpenConfirm(true);
            if (viewMode === "update") handleUpdate();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
              disabled={viewMode === "view"}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              required
              disabled={viewMode === "view"}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              value={form.tags}
              onChange={handleFormChange}
              placeholder="e.g. fitness, yoga, wellness"
              disabled={viewMode === "view"}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            {viewMode === "create" && (
              <Button type="submit" disabled={creating}>
                Create
              </Button>
            )}
            {viewMode === "update" && (
              <Button type="submit" disabled={creating}>
                Update
              </Button>
            )}
          </DialogFooter>
        </form>
        {/* Confirmation Dialog for create */}
        {viewMode === "create" && (
          <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Program Creation</DialogTitle>
              </DialogHeader>
              <div>
                <p>
                  Are you sure you want to create the program <b>{form.name}</b>
                  ?
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenConfirm(false)}
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
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading) return <p>Loading programs...</p>;

  if (!loading && programs.length === 0) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardContent className="py-8 flex flex-col items-center">
          <span className="text-muted-foreground text-lg mb-2">
            No programs found.
          </span>
          <span className="text-sm text-muted-foreground mb-4">
            Create a new program to see it here.
          </span>
          <Button variant="default" className="mb-4" onClick={openCreateDialog}>
            + New Program
          </Button>
          {programDialog}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Filter by name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Filter by tag"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div>
          <Button variant="default" onClick={openCreateDialog}>
            + New Program
          </Button>
          {programDialog}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPrograms.map((program) => (
            <TableRow key={program.id}>
              <TableCell>{program.name}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate">{program.description}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {program.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openUpdateDialog(program)}
                >
                  Update
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filteredPrograms.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No programs match your filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* The dialog is rendered here so it can be opened for both create and update */}
      {programDialog}
    </div>
  );
}
