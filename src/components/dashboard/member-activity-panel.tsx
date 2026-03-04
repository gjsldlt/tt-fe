"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Search,
  UserX,
  X,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isBefore,
  isAfter,
} from "date-fns";
import { getMemberProgressLogActivity } from "@/lib/services/progresslog.services";

type MemberActivity = {
  member: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  logCount: number;
  activeTraineeCount: number;
};

type Props = {
  selectedMemberId: string | null;
  onSelectMember: (id: string | null, name?: string) => void;
};

/**
 * 🔥 Member Activity Panel — shows buddies and their progress log activity
 * within a configurable date range (defaults to current work week Mon–Fri).
 * Only flags members who have active trainees but submitted zero logs.
 * Click a member to filter progress logs by that buddy.
 */
export function MemberActivityPanel({
  selectedMemberId,
  onSelectMember,
}: Props) {
  const [startDate, setStartDate] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [endDate, setEndDate] = useState<Date>(
    endOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getMemberProgressLogActivity(
        startDate.toISOString(),
        endDate.toISOString(),
      );
      // Sort: members with active trainees but 0 logs first, then no-buddy members last, rest by name
      results.sort((a, b) => {
        const aMissing = a.activeTraineeCount > 0 && a.logCount === 0;
        const bMissing = b.activeTraineeCount > 0 && b.logCount === 0;
        const aNoTrainees = a.activeTraineeCount === 0;
        const bNoTrainees = b.activeTraineeCount === 0;

        if (aMissing && !bMissing) return -1;
        if (!aMissing && bMissing) return 1;
        if (aNoTrainees && !bNoTrainees) return 1;
        if (!aNoTrainees && bNoTrainees) return -1;
        return a.member.lastname.localeCompare(b.member.lastname);
      });
      setActivities(results);
    } catch (err) {
      console.error("Error fetching member activity:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // 🔍 Client-side filter by member name or email
  const filtered = activities.filter((a) => {
    if (!search.trim()) return true;
    const s = search.trim().toLowerCase();
    return (
      a.member.firstname.toLowerCase().includes(s) ||
      a.member.lastname.toLowerCase().includes(s) ||
      a.member.email.toLowerCase().includes(s)
    );
  });

  const missingCount = filtered.filter(
    (a) => a.logCount === 0 && a.activeTraineeCount > 0,
  ).length;

  return (
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
      <CardHeader className="px-4 py-3 border-b shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Buddy Log Activity</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {selectedMemberId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-1.5"
                onClick={() => onSelectMember(null)}
              >
                Clear
              </Button>
            )}
            {!loading && missingCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {missingCount} missing
              </Badge>
            )}
          </div>
        </div>

        {/* Date range selectors */}
        <div className="flex items-center gap-1 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 px-2"
              >
                <CalendarDays className="h-3 w-3" />
                {format(startDate, "MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  if (!d) return;
                  setStartDate(d);
                  // If endDate is before the new startDate, snap it to startDate + 7 days
                  if (isBefore(endDate, d) || isAfter(endDate, addDays(d, 7))) {
                    setEndDate(addDays(d, 7));
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 px-2"
              >
                <CalendarDays className="h-3 w-3" />
                {format(endDate, "MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  if (!d) return;
                  setEndDate(d);
                  // If startDate is after the new endDate, snap it to endDate - 7 days
                  if (
                    isAfter(startDate, d) ||
                    isBefore(startDate, subDays(d, 7))
                  ) {
                    setStartDate(subDays(d, 7));
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      {/* 🔍 Search input */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs pl-7 pr-7"
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No buddies assigned yet
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((a) => {
              const hasBuddies = a.activeTraineeCount > 0;
              const isMissing = hasBuddies && a.logCount === 0;

              const isSelected = selectedMemberId === a.member.id;

              return (
                <li
                  key={a.member.id}
                  className={`flex items-center justify-between px-3 py-2 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                      : isMissing
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : !hasBuddies
                          ? "opacity-50 hover:opacity-70"
                          : "hover:bg-muted/30"
                  }`}
                  onClick={() =>
                    onSelectMember(
                      isSelected ? null : a.member.id,
                      isSelected
                        ? undefined
                        : `${a.member.firstname} ${a.member.lastname}`,
                    )
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {a.member.firstname} {a.member.lastname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {!hasBuddies
                        ? "No active trainees assigned"
                        : a.member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {!hasBuddies ? (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <UserX className="h-3 w-3" />
                        N/A
                      </Badge>
                    ) : isMissing ? (
                      <Badge variant="destructive" className="text-[10px]">
                        0 logs
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {a.logCount}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
