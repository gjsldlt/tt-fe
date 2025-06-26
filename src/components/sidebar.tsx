"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard,
  BookOpen,
  LogOut,
  Users2,
  GraduationCap,
  ChevronsRightLeft,
  ChevronsLeftRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Member } from "@/models/member";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // const [userEmail, setUserEmail] = useState<string | null>(null);
  // const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null); // Store member data
  const [openDialog, setOpenDialog] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Fetch user and then member data
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        // Query member table for this user
        const { data: memberData, error } = await supabase
          .from("member")
          .select("*")
          .eq("auth_user_id", data.user.id)
          .single();

        if (!error) {
          setMember(memberData as Member);
        } else {
          console.error("Error fetching member data:", error);
          setMember(null);
          router.replace("/login");
        }
      }
    });
  }, [supabase, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "member"], // visible to all roles
    },
    {
      label: "Members",
      href: "/members",
      icon: Users2,
      roles: ["admin"], // visible to all roles
    },
    {
      label: "Programs",
      href: "/programs",
      icon: BookOpen,
      roles: ["admin", "member"], // only admin
    },
    {
      label: "Trainees",
      href: "/trainees",
      icon: GraduationCap,
      roles: ["admin", "member"], // visible to all roles
    },
  ];

  return (
    <aside
      className={cn(
        "border-r flex flex-col justify-between h-screen bg-background text-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top: Project name & collapse button */}
      <div>
        <div className="h-16 flex items-center justify-between border-b px-4">
          <span
            className={cn(
              "text-xl font-bold transition-all duration-200",
              collapsed && "opacity-0 w-0 overflow-hidden"
            )}
          >
            TraineeTracker
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {!collapsed ? (
              <ChevronsRightLeft size={20} />
            ) : (
              <ChevronsLeftRight size={20} />
            )}
          </Button>
        </div>

        {/* Nav menu */}
        <nav className={cn("px-2 py-6 space-y-2", collapsed && "px-2")}>
          {navItems
            .filter(
              (item) => !member || (member && item.roles.includes(member.role))
            )
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-all",
                  pathname.startsWith(item.href)
                    ? "bg-muted font-semibold"
                    : "",
                  collapsed && "justify-center px-2",
                  !collapsed && "gap-3"
                )}
              >
                <item.icon size={20} className="shrink-0" />
                <span
                  className={cn(
                    "transition-all duration-200",
                    collapsed && "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            ))}
        </nav>
      </div>

      {/* Bottom: Theme + Profile */}
      <div
        className={cn(
          "p-4 border-t space-y-4",
          collapsed && "px-2 flex-col align-center justify-center"
        )}
      >
        <ThemeToggle collapsed={collapsed} />

        {member && (
          <div className="text-sm text-muted-foreground flex">
            <Avatar className="h-11 w-11">
              <AvatarFallback>
                {`${member?.firstname[0] ?? ""}${
                  member?.lastname[0] ?? ""
                }`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="ml-3 flex flex-col">
                <p className="font-medium text-foreground">{`${member?.firstname} ${member?.lastname}`}</p>
                <p className="text-xs">
                  <span className="font-semibold">{member?.email}</span>
                </p>
                <p className="text-xs">
                  <span className="font-semibold">
                    {member?.role.toUpperCase()}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mt-2">
              {collapsed ? <LogOut size={20} /> : "Logout"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure you want to log out?</DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={logout}>
                Log out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
