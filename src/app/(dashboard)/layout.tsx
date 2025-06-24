import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "../context/user-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-muted/10 w-full">{children}</main>
      </div>
    </UserProvider>
  );
}
