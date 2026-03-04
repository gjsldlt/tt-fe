"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import { getProgressLogsPaginated } from "@/lib/services/progresslog.services";
import { format, formatDistanceToNow } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogRow = Record<string, any>;

type Props = {
  selectedTraineeId: string | null;
  selectedTraineeName: string;
  selectedMemberId: string | null;
  selectedMemberName: string;
  onClearTrainee: () => void;
  onClearMember: () => void;
};

const PAGE_SIZE = 10;

/**
 * 🔥 Progress Logs Panel — paginated, filterable by selected trainee.
 * Shows the latest progress logs across all trainees or filtered to one.
 * Click a row to open a detail modal.
 */
export function ProgressLogsPanel({
  selectedTraineeId,
  selectedTraineeName,
  selectedMemberId,
  selectedMemberName,
  onClearTrainee,
  onClearMember,
}: Props) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await getProgressLogsPaginated(
        page,
        PAGE_SIZE,
        selectedTraineeId ?? undefined,
        selectedMemberId ?? undefined,
      );
      setLogs(data);
      setTotalCount(count);
    } catch (err) {
      console.error("Error fetching progress logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTraineeId, selectedMemberId]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedTraineeId, selectedMemberId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /** Safely format a timestamp to relative time */
  const timeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">
            Progress Logs ({totalCount})
          </CardTitle>
        </div>
      </CardHeader>

      {/* 🏷️ Dismissible filter chips */}
      {(selectedTraineeId || selectedMemberId) && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b shrink-0">
          {selectedTraineeId && (
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              onClick={onClearTrainee}
            >
              Trainee: {selectedTraineeName || "Selected"}
              <X className="h-3 w-3 ml-0.5" />
            </Badge>
          )}
          {selectedMemberId && (
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              onClick={onClearMember}
            >
              Member: {selectedMemberName || "Selected"}
              <X className="h-3 w-3 ml-0.5" />
            </Badge>
          )}
        </div>
      )}

      <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No progress logs found
          </div>
        ) : (
          <ul className="divide-y">
            {logs.map((log) => {
              const trainee = log.traineeId;
              const author = log.created_by;
              return (
                <li
                  key={log.id}
                  className="px-3 py-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {log.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trainee
                          ? `${trainee.firstname} ${trainee.lastname}`
                          : "Unknown trainee"}
                        {author
                          ? ` · by ${author.firstname} ${author.lastname}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                      {timeAgo(log.created_at)}
                    </span>
                  </div>
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

      {/* 📋 Progress log detail modal */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedLog &&
            (() => {
              const trainee = selectedLog.traineeId;
              const author = selectedLog.created_by;
              const program = selectedLog.programAssignment?.program;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedLog.title}</DialogTitle>
                    <DialogDescription className="space-y-1 pt-1">
                      <span className="block">
                        Trainee:{" "}
                        <strong>
                          {trainee
                            ? `${trainee.firstname} ${trainee.lastname}`
                            : "Unknown"}
                        </strong>
                      </span>
                      <span className="block">
                        Author:{" "}
                        <strong>
                          {author
                            ? `${author.firstname} ${author.lastname}`
                            : "Unknown"}
                        </strong>
                      </span>
                      {program && (
                        <span className="block">
                          Program: <strong>{program.name}</strong>
                        </span>
                      )}
                      <span className="block text-muted-foreground text-xs">
                        {format(new Date(selectedLog.created_at), "PPPp")}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: selectedLog.description || "<em>No content</em>",
                    }}
                  />
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
