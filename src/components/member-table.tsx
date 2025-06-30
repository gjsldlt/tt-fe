"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getMembers } from "@/lib/services/member.services";

type Member = {
  id: string;
  auth_user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: "unverified" | "member" | "admin";
  active: boolean;
};

export function MemberTable() {
  const supabase = createClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [editedMembers, setEditedMembers] = useState<
    Record<string, Partial<Member>>
  >({});
  const [loading, setLoading] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await getMembers();
        setMembers(response);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to fetch members");
      }

      setLoading(false);
    };

    fetch();
  }, [supabase]);

  const onChange = (id: string, updates: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    setEditedMembers((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Retrieve the access token from Supabase auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      for (const id of Object.keys(editedMembers)) {
        const updates = {
          ...members.find((m) => m.id === id), // Get the current member data
          ...editedMembers[id],
        };
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/member?id=eq.${id}`,
            {
              method: "PUT", // Use POST since PATCH is blocked
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
              `Error saving ${id}: ${errorData.message || res.statusText}`
            );
          }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          toast.error(`Error saving ${id}: ${errorMessage}`);
        }
      }

      toast.success("All changes saved.");
    } catch (err) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      toast.error(`Error saving members: ${errorMessage}`);
    } finally {
      setSaving(false);
      setOpenConfirmDialog(false);
      setEditedMembers({});
    }
  };

  // if (!errorOccurred) {
  //   toast.success("All changes saved.");
  //   setEditedMembers({});
  // }

  // setSaving(false);
  // setOpenConfirmDialog(false);

  const summaryChanges = Object.entries(editedMembers).map(([id, changes]) => {
    const member = members.find((m) => m.id === id);
    return {
      id,
      name: `${member?.firstname} ${member?.lastname}`,
      changes: Object.entries(changes).map(
        ([field, value]) => `${field}: ${String(value)}`
      ),
    };
  });

  if (loading)
    return <p className="text-muted-foreground text-sm">Loading members...</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Input
                    value={member.firstname}
                    onChange={(e) =>
                      onChange(member.id, { firstname: e.target.value })
                    }
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={member.lastname}
                    onChange={(e) =>
                      onChange(member.id, { lastname: e.target.value })
                    }
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={member.email}
                    onChange={(e) =>
                      onChange(member.id, { email: e.target.value })
                    }
                    className="w-full"
                    type="email"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      onChange(member.id, { role: value as Member["role"] })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={member.active}
                      onCheckedChange={(value) =>
                        onChange(member.id, { active: value })
                      }
                    />
                    <span className="text-xs">
                      {member.active ? "Yes" : "No"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {Object.keys(editedMembers).length > 0 && (
        <div className="flex justify-end">
          <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
            <DialogTrigger asChild>
              <Button disabled={saving} variant="default">
                Save All Changes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm changes</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 max-h-[300px] overflow-y-auto text-sm">
                {summaryChanges.map(({ id, name, changes }) => (
                  <div key={id} className="p-2 border rounded-md">
                    <p className="font-medium">{name}</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {changes.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : "Confirm Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
