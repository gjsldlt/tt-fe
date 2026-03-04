"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Layers, Users } from "lucide-react";
import { getTeamStats, TeamStat } from "@/lib/services/trainee.services";
import { useRouter } from "next/navigation";

/**
 * 🔥 Teams Metric Card — shows count of teams with active trainees (main number)
 * and total teams (subtext). Clicking opens a dialog listing all teams;
 * clicking a team navigates to the trainees page filtered by that team.
 */
export function TeamsCard({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTeamCount, setActiveTeamCount] = useState(0);
  const [totalTeamCount, setTotalTeamCount] = useState(0);
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [open, setOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getTeamStats();
      setActiveTeamCount(stats.activeTeamCount);
      setTotalTeamCount(stats.totalTeamCount);
      setTeams(stats.teams);
    } catch (err) {
      console.error("Error fetching team stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  /** Navigate to trainees page with team filter pre-applied */
  const handleTeamClick = (team: string) => {
    setOpen(false);
    router.push(`/trainees?status=active&team=${encodeURIComponent(team)}`);
  };

  return (
    <>
      <Card
        className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${className ?? ""}`}
        onClick={() => !loading && setOpen(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Teams</CardTitle>
          <div className="h-4 w-4 text-muted-foreground">
            {loading ? <Skeleton className="h-4 w-4 rounded" /> : <Layers />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : activeTeamCount}
          </div>
          <p className="text-xs text-muted-foreground">
            active teams · {loading ? "..." : totalTeamCount} total
          </p>
        </CardContent>
      </Card>

      {/* 📋 Team list dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              All Teams ({totalTeamCount})
            </DialogTitle>
            <DialogDescription>
              Click a team to view its trainees
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto min-h-0 -mx-2">
            <ul className="divide-y">
              {teams.map((t) => (
                <li
                  key={t.team}
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => handleTeamClick(t.team)}
                >
                  <span className="text-sm font-medium">{t.team}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="default" className="text-[10px] gap-1">
                      <Users className="h-3 w-3" />
                      {t.activeCount}
                    </Badge>
                    {t.inactiveCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {t.inactiveCount} inactive
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
              {teams.length === 0 && (
                <li className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No teams found
                </li>
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
