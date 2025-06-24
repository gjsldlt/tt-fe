import { ProgramsTable } from "@/components/programs-table";
import { ProtectedRoute } from "@/components/protected-route";

export default function ProgramsPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen w-full">
        <div className="h-16 flex items-center justify-start border-b px-4 w-full">
          <h1 className="text-2xl font-bold ">Programs</h1>
        </div>
        <div className="flex-1 p-4 bg-muted/10">
          <ProgramsTable />
        </div>
      </div>
    </ProtectedRoute>
  );
}
