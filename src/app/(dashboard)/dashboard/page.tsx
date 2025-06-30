"use client";
import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { createClient } from "@/lib/supabase";
import { MetricCard } from "@/components/metric-card";
import { BookOpen, RefreshCw, Users } from "lucide-react";
import { getActiveTrainees } from "@/lib/services/trainee.services";

type Member = {
  id: string;
  role: "admin" | "member" | "unverified";
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [member, setMember] = useState<Member | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [programsCount, setProgramsCount] = useState<number>(0);
  const [traineeCount, setTraineeCount] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Get member info
      const { data: memberData } = await supabase
        .from("member")
        .select("id, role")
        .eq("auth_user_id", userData.user.id)
        .single();
      setMember(memberData);

      // Get programs count
      const { count: programs } = await supabase
        .from("program")
        .select("id", { count: "exact", head: true });
      setProgramsCount(programs || 0);

      // If admin, get members count
      if (memberData?.role === "admin") {
        const { count: members } = await supabase
          .from("member")
          .select("id", { count: "exact", head: true });
        setMembersCount(members || 0);
      }

      const trainees = await getActiveTrainees();
      setTraineeCount(trainees.length);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [supabase, fetchData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(Math.floor(num));
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen w-full">
        <div className="h-16 flex items-center justify-space-around border-b px-4 w-full">
          <h1 className="text-2xl font-bold ">Dashboard</h1>
          <div className="flex-1" />
          <button
            className="ml-4 text-sm  hover:underline"
            onClick={() => fetchData()}
          >
            <RefreshCw className="inline mr-1" />
          </button>
        </div>
        <div className="flex-1 p-4 bg-muted/10">
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {member?.role === "admin" && (
              <MetricCard
                title="Total Members"
                value={loading ? "Loading.." : formatNumber(membersCount)}
                description="active committee members"
                icon={
                  loading ? <RefreshCw className="animate-spin" /> : <Users />
                }
                className="xl:col-span-2"
              />
            )}
            <MetricCard
              title="Total Programs"
              value={loading ? "Loading.." : formatNumber(programsCount)}
              description="active programs in the system"
              icon={
                loading ? <RefreshCw className="animate-spin" /> : <BookOpen />
              }
              className="xl:col-span-2"
            />
            <MetricCard
              title="Total Active Trainees"
              value={loading ? "Loading.." : formatNumber(traineeCount)}
              description="active trainees in the system"
              icon={
                loading ? <RefreshCw className="animate-spin" /> : <Users />
              }
              className="xl:col-span-2"
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
