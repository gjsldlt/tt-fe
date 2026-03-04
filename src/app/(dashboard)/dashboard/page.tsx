"use client";
import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { createClient } from "@/lib/supabase";
import { MetricCard } from "@/components/metric-card";
import { BookOpen, RefreshCw, Users } from "lucide-react";
import { countActiveTrainees } from "@/lib/services/trainee.services";
import { useTopbar } from "@/app/context/topbar-context";
import { ActiveTraineesPanel } from "@/components/dashboard/active-trainees-panel";
import { ProgressLogsPanel } from "@/components/dashboard/progress-logs-panel";
import { MemberActivityPanel } from "@/components/dashboard/member-activity-panel";

type Member = {
  id: string;
  role: "admin" | "member" | "unverified";
};

/**
 * 🔥 Admin Dashboard — non-scrollable, full-viewport layout.
 * Top row: compact metric cards.
 * Bottom area: Active Trainees | Progress Logs | Buddy Activity panels.
 */
export default function DashboardPage() {
  const { setTopbar } = useTopbar();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [member, setMember] = useState<Member | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [programsCount, setProgramsCount] = useState<number>(0);
  const [traineeCount, setTraineeCount] = useState<number>(0);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(
    null,
  );
  const [selectedTraineeName, setSelectedTraineeName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState("");

  /** 🔥 Handlers that track both ID and display name */
  const handleSelectTrainee = (id: string | null, name?: string) => {
    setSelectedTraineeId(id);
    setSelectedTraineeName(id ? (name ?? "Trainee") : "");
  };
  const handleSelectMember = (id: string | null, name?: string) => {
    setSelectedMemberId(id);
    setSelectedMemberName(id ? (name ?? "Member") : "");
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: memberData } = await supabase
        .from("member")
        .select("id, role")
        .eq("auth_user_id", userData.user.id)
        .single();
      setMember(memberData);

      const { count: programs } = await supabase
        .from("program")
        .select("id", { count: "exact", head: true });
      setProgramsCount(programs || 0);

      if (memberData?.role === "admin") {
        const { count: members } = await supabase
          .from("member")
          .select("id", { count: "exact", head: true });
        setMembersCount(members || 0);
      }

      const activeCount = await countActiveTrainees();
      setTraineeCount(activeCount);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [supabase, fetchData]);

  useEffect(() => {
    setTopbar(
      <div className="h-16 flex items-center justify-between border-b px-4 w-full">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          className="ml-4 text-sm hover:underline"
          onClick={() => fetchData()}
        >
          <RefreshCw className="inline mr-1" />
        </button>
      </div>,
    );
    return () => {
      setTopbar(null);
    };
  }, [fetchData, setTopbar]);

  const fmt = (num: number) =>
    new Intl.NumberFormat("en-US").format(Math.floor(num));

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* 📊 Compact metric cards row */}
        <div className="grid gap-3 grid-cols-3 p-3 shrink-0">
          {member?.role === "admin" && (
            <MetricCard
              title="Members"
              value={loading ? "..." : fmt(membersCount)}
              description="committee members"
              icon={
                loading ? <RefreshCw className="animate-spin" /> : <Users />
              }
            />
          )}
          <MetricCard
            title="Programs"
            value={loading ? "..." : fmt(programsCount)}
            description="active programs"
            icon={
              loading ? <RefreshCw className="animate-spin" /> : <BookOpen />
            }
          />
          <MetricCard
            title="Active Trainees"
            value={loading ? "..." : fmt(traineeCount)}
            description="active trainees"
            icon={loading ? <RefreshCw className="animate-spin" /> : <Users />}
          />
        </div>

        {/* 📋 Main panels — fill remaining viewport, no page scroll */}
        {member?.role === "admin" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-3 pb-3 min-h-0 flex-1">
            <ActiveTraineesPanel
              selectedTraineeId={selectedTraineeId}
              onSelectTrainee={handleSelectTrainee}
            />
            <ProgressLogsPanel
              selectedTraineeId={selectedTraineeId}
              selectedTraineeName={selectedTraineeName}
              selectedMemberId={selectedMemberId}
              selectedMemberName={selectedMemberName}
              onClearTrainee={() => handleSelectTrainee(null)}
              onClearMember={() => handleSelectMember(null)}
            />
            <MemberActivityPanel
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMember}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3 pb-3 min-h-0 flex-1">
            <ActiveTraineesPanel
              selectedTraineeId={selectedTraineeId}
              onSelectTrainee={handleSelectTrainee}
            />
            <ProgressLogsPanel
              selectedTraineeId={selectedTraineeId}
              selectedTraineeName={selectedTraineeName}
              selectedMemberId={null}
              selectedMemberName=""
              onClearTrainee={() => handleSelectTrainee(null)}
              onClearMember={() => {}}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
