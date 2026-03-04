"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, Users, X } from "lucide-react";
import { getActiveTraineesPaginated } from "@/lib/services/trainee.services";

type TraineeRow = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  originalTeam: string;
  active: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buddy?: any;
};

type Props = {
  selectedTraineeId: string | null;
  onSelectTrainee: (id: string | null, name?: string) => void;
};

const PAGE_SIZE = 10;

/**
 * 🔥 Active Trainees Panel — paginated list with selection support.
 * Clicking a trainee filters the progress logs panel; click again to deselect.
 */
export function ActiveTraineesPanel({
  selectedTraineeId,
  onSelectTrainee,
}: Props) {
  const [trainees, setTrainees] = useState<TraineeRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ⚡ Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTrainees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await getActiveTraineesPaginated(
        page,
        PAGE_SIZE,
        debouncedSearch || undefined,
      );
      setTrainees(data as TraineeRow[]);
      setTotalCount(count);
    } catch (err) {
      console.error("Error fetching active trainees:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  const handleSelect = (t: TraineeRow) => {
    if (selectedTraineeId === t.id) {
      onSelectTrainee(null);
    } else {
      onSelectTrainee(t.id, `${t.firstname} ${t.lastname}`);
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">
            Active Trainees ({totalCount})
          </CardTitle>
        </div>
        {selectedTraineeId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onSelectTrainee(null)}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </CardHeader>

      {/* 🔍 Search input */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search trainees..."
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : trainees.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No active trainees found
          </div>
        ) : (
          <ul className="divide-y">
            {trainees.map((t) => {
              const buddyInfo = t.buddy?.[0]?.member;
              return (
                <li
                  key={t.id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedTraineeId === t.id
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : ""
                  }`}
                  onClick={() => handleSelect(t)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {t.lastname}, {t.firstname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {buddyInfo
                        ? `Buddy: ${buddyInfo.firstname} ${buddyInfo.lastname}`
                        : "No buddy assigned"}
                    </p>
                  </div>
                  {t.originalTeam && (
                    <Badge
                      variant="secondary"
                      className="ml-2 text-[10px] shrink-0"
                    >
                      {t.originalTeam}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Card>
  );
}
