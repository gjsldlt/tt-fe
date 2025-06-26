import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "../context/user-context";
import { MemberProvider } from "../context/member-context";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <MemberProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-muted/10 w-full">{children}</main>
          <Toaster />
        </div>
      </MemberProvider>
    </UserProvider>
  );
}
