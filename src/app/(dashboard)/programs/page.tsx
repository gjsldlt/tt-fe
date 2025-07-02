"use client";
import { useTopbar } from "@/app/context/topbar-context";
import { ProgramsTable } from "@/components/programs-table";
import { ProtectedRoute } from "@/components/protected-route";
import { ProgramsTableRef } from "@/models/program";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProgramsPage() {
  const { setTopbar } = useTopbar();
  const programsTableRef = useRef<ProgramsTableRef>(null);

  useEffect(() => {
    setTopbar(
      <>
        <h1 className="text-2xl font-bold ">Programs</h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          className="ml-4 bg-primary text-white px-4 py-2 rounded"
          onClick={() => programsTableRef.current?.openCreateDialog()}
        >
          <Plus className="h-4 w-4" /> New Program
        </Button>
      </>
    );
    return () => {
      setTopbar(null);
    };
  }, [setTopbar]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 p-4 bg-muted/10">
          <ProgramsTable ref={programsTableRef} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
