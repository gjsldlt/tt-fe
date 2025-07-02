"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { DataTable, ColumnDef } from "@/components/data-table";
import { Program, ProgramsTableRef } from "@/models/program";
import { getPrograms } from "@/lib/services/program.services";
import RichTextEditor from "./rte";

export const ProgramsTable = forwardRef<ProgramsTableRef, object>(
  function ProgramsTable(_props, ref) {
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

    useEffect(() => {
      const fetchPrograms = async () => {
        setLoading(true);
        try {
          const response = await getPrograms();
          setPrograms(response);
        } catch (e) {
          console.error("Error fetching programs:", e);
          toast.error("Failed to fetch programs");
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
              p.id === viewedProgramId
                ? { ...p, ...updates, tags: tagsArray }
                : p
            )
          );
          setOpenDialog(false);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        toast.error(`Error updating program: ${errorMessage}`);
      }
      setCreating(false);
      setOpenConfirm(false);
    };

    // Expose openCreateDialog to parent via ref
    useImperativeHandle(ref, () => ({
      openCreateDialog,
    }));

    // DataTable columns definition
    const columns: ColumnDef<Program>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: (value) => value as string,
        sortable: true,
        filterable: true,
        filterConfig: { type: "text", placeholder: "Filter by name" },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (value) => (
          <div className="max-w-xs truncate">{value as string}</div>
        ),
        sortable: false,
        filterable: false,
        filterConfig: { type: "text", placeholder: "Filter by description" },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: (_value, row) => (
          <div className="flex flex-wrap gap-1">
            {row.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ),
        filterable: true,
        filterConfig: {
          type: "select",
          placeholder: "Filter by tag",
          options: programs
            .flatMap((p) => p.tags)
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .map((tag) => ({
              value: tag,
              label: tag,
            })),
          // Custom filter function to handle comma-separated tags
          filterFunction: (row, value) => {
            const tags = row.tags.join(", ");
            return tags.toLowerCase().includes(value.toLowerCase());
          },
          getValue: (row: Program) => row.tags.join(", "),
        },
      },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: (_value, row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openUpdateDialog(row)}
          >
            Update
          </Button>
        ),
      },
    ];

    // Dialog for creating or updating a program
    const programDialog = (
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="flex flex-col !max-w-[70vw] !max-h-2xl !h-[70vh] !w-[70vw]">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "create"
                ? "Create a new program"
                : "Update Program"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (viewMode === "create") setOpenConfirm(true);
              if (viewMode === "update") handleUpdate();
            }}
            className="space-y-4 flex flex-col flex-1 overflow-y-auto"
          >
            <div>
              <Label className="mb-2" htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                disabled={viewMode === "view"}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <Label className="mb-2" htmlFor="description">
                Description
              </Label>
              <div className="flex-1">
                <RichTextEditor
                  value={form.description}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, description: value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="mb-2" htmlFor="tags">
                Tags (comma separated)
              </Label>
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
                    Are you sure you want to create the program{" "}
                    <b>{form.name}</b>?
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

    return (
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <span>Loading programs...</span>
          </div>
        )}
        <DataTable
          data={programs}
          columns={columns}
          emptyMessage="No programs match your filter."
          maxHeight="60vh"
        />
        {programDialog}
      </div>
    );
  }
);
