"use client";
import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "../context/user-context";
import { MemberProvider } from "../context/member-context";
import { TopbarProvider, useTopbar } from "../context/topbar-context";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";

function TopbarContainer() {
  const { topbar } = useTopbar();
  const { setMobileOpen } = useSidebar();
  return topbar ? (
    <div className="w-full flex items-center justify-between border-b p-4 z-30 h-16">
      <button
        className=" z-40 md:hidden bg-background p-2 shadow"
        onClick={() => {
          console.log("Opening sidebar");
          setMobileOpen(true);
        }}
        aria-label="Open sidebar"
        type="button"
      >
        <Menu size={24} />
      </button>
      {topbar}
    </div>
  ) : null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <MemberProvider>
        <SidebarProvider>
          <TopbarProvider>
            <div className="flex h-screen w-screen md:overflow-hidden">
              <Sidebar />
              <div className="flex flex-1 flex-col h-screen">
                <TopbarContainer />
                <main className="flex-1 sm:overflow-auto sm:p-4">
                  {children}
                </main>
                <Toaster />
              </div>
            </div>
          </TopbarProvider>
        </SidebarProvider>
      </MemberProvider>
    </UserProvider>
  );
}
