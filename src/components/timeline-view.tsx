"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  UserCheck,
  Trash,
  Edit3,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import {
  ProgramAssignment,
  ProgressLog,
  Trainee,
  TraineeAuditLog,
} from "@/models/trainee";
import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, ColumnDef } from "@/components/data-table"; // Adjust import as needed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

const CONCAT_CHAR_COUNT = 100; // Character limit for concatenated text
interface JoinEvent {
  type: "join";
  date: string;
  member: Trainee;
  createdBy: string;
  [key: string]: unknown;
}

interface ProgressLogEvent {
  type: "progress_log";
  date: string;
  data: ProgressLog;
  createdBy: string;
  [key: string]: unknown;
}

interface ProgramAssignmentEvent {
  type: "program_assignment";
  date: string;
  data: ProgramAssignment;
  createdBy: string;
  [key: string]: unknown;
}

interface TraineeAuditLogEvent {
  type: "audit_log";
  date: string;
  data: TraineeAuditLog;
  createdBy: string;
  [key: string]: unknown;
}

type TimelineEvent =
  | JoinEvent
  | ProgressLogEvent
  | ProgramAssignmentEvent
  | TraineeAuditLogEvent;

// Helper function to format field names
const formatFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    originalTeam: "Team Assignment",
    active: "Status",
  };
  return fieldMap[fieldName] || fieldName;
};

// Helper function to format field values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatFieldValue = (value: any, fieldName: string): string => {
  if (fieldName === "active") {
    return value ? "Active" : "Inactive";
  }
  if (fieldName === "created_at" || fieldName === "updated_at") {
    return new Date(value).toLocaleDateString();
  }
  if (value === "" || value === null || value === undefined) {
    return "(empty)";
  }
  return String(value);
};

function JoinEventCard({ event }: { event: JoinEvent }) {
  return (
    <Card className="border-l-4 border-l-blue-500 w-full">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold truncate">
                Joined the Team
              </CardTitle>
              <CardDescription className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarFallback className="text-xs sm:text-sm">
              {event.member.firstname.charAt(0)}
              {event.member.lastname.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base truncate">
              {event.member.firstname} {event.member.lastname}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {event.member.originalTeam}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressLogCard({
  event,
  deleteProgressLog,
  concat = false,
}: {
  event: ProgressLogEvent;
  deleteProgressLog: (logId: string) => void;
  concat?: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-green-500 w-full flex flex-col justify-stretch items-stretch gap-y-2">
      <CardHeader className="sm:px-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-1.5 bg-green-100 rounded-full flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                {event.data.title}
              </CardTitle>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-start space-x-2 md:justify-center">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-xs"
            >
              Progress Log
            </Badge>
            <button
              className=" hover:text-red-400 text-xs sm:text-sm transition-colors mb-1"
              onClick={() => {
                deleteProgressLog(event.data.id);
              }}
            >
              <Trash className="h-4 w-4 inline-block mr-1" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 sm:px-6">
        <div
          className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{
            __html:
              event.data.description.length < CONCAT_CHAR_COUNT || !concat
                ? event.data.description
                : event.data.description.slice(0, CONCAT_CHAR_COUNT) + "...",
          }}
        />
      </CardContent>
      <CardFooter className="flex-1 space-y-2 sm:space-y-0 text-xs sm:text-sm px-3 sm:px-6 text-stone-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm">
          {event.data.programAssignmentId && (
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{event.data.programAssignment?.program?.name}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              {event.data.created_by.firstname} {event.data.created_by.lastname}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function ProgramAssignmentCard({
  event,
  deleteProgramAssignment,
  concat = false,
}: {
  event: ProgramAssignmentEvent;
  deleteProgramAssignment: (assignmentId: string) => void;
  concat?: boolean;
}) {
  const isCompleted = event.data.done_at !== null;
  const borderColor = isCompleted
    ? "border-l-purple-500"
    : "border-l-orange-500";
  const iconBgColor = isCompleted ? "bg-purple-100" : "bg-orange-100";
  const iconColor = isCompleted ? "text-purple-600" : "text-orange-600";
  const badgeVariant = isCompleted ? "secondary" : "default";
  const badgeText = isCompleted ? "Completed" : "In Progress";

  return (
    <Card
      className={`border-l-4 ${borderColor} w-full flex flex-col justify-stretch items-stretch gap-y-2`}
    >
      <CardHeader className="px-3 sm:px-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className={`p-2 ${iconBgColor} rounded-full flex-shrink-0`}>
              {isCompleted ? (
                <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
              ) : (
                <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                {event.data.program?.name || `Program ${event.data.program_id}`}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant={badgeVariant} className="text-xs">
              {badgeText}
            </Badge>
            {/* Delete Progress log */}
            <button
              className=" hover:text-red-400 text-xs sm:text-sm transition-colors mb-1"
              onClick={() => {
                deleteProgramAssignment(event.data.id);
              }}
            >
              <Trash className="h-4 w-4 inline-block mr-1" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 space-y-3">
        <div
          className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{
            __html:
              event.data.notes.length < CONCAT_CHAR_COUNT || !concat
                ? event.data.notes
                : event.data.notes.slice(0, CONCAT_CHAR_COUNT) + "...",
          }}
        />

        {isCompleted && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm p-2 sm:p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-green-600 font-medium">
              Completed on {new Date(event.data.done_at!).toLocaleDateString()}
            </span>
          </div>
        )}

        {!isCompleted && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm p-2 sm:p-3 bg-orange-50 rounded-lg">
            <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-orange-600 font-medium">
              Currently in progress
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-1 space-y-2 sm:space-y-0 text-xs sm:text-sm px-3 sm:px-6 text-stone-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Assigned {new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              {event.data.assignedBy?.firstname}{" "}
              {event.data.assignedBy?.lastname}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function AuditLogCard({
  event,
  concat = false,
}: {
  event: TraineeAuditLog;
  concat?: boolean;
}) {
  const changesCount = Object.keys(event.changes).length;
  return (
    <Card className="border-l-4 border-l-amber-500 w-full  gap-y-2">
      <CardHeader className="px-3 sm:px-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-2 bg-amber-100 rounded-full flex-shrink-0">
              <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                Profile Updated
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
            >
              {changesCount} Change{changesCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {!concat && (
        <CardContent className="px-3 sm:px-6 space-y-4">
          {/* Changes Summary */}
          <div className="space-y-3">
            {Object.entries(event.changes).map(([fieldName, change]) => (
              <div key={fieldName} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="font-medium text-sm">
                    {formatFieldName(fieldName)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      From
                    </span>
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 font-mono text-xs break-all">
                      {formatFieldValue(change.old, fieldName)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      To
                    </span>
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-xs break-all">
                      {formatFieldValue(change.new, fieldName)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      <CardFooter className="spflex-1 space-y-2 sm:space-y-0 text-xs sm:text-sm px-3 sm:px-6 text-stone-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{new Date(event.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              {`${event.updatedBy?.firstname} ${event.updatedBy?.lastname}`}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Main Timeline Component
export function TimelineView({
  trainee,
  dataLogs = [],
  dataAssignments = [],
  traineeAuditLogs = [],
  deleteProgressLog = () => {},
  deleteProgramAssignment = () => {},
}: {
  trainee: Trainee;
  dataLogs: ProgressLog[];
  dataAssignments: ProgramAssignment[];
  traineeAuditLogs?: TraineeAuditLog[];
  deleteProgressLog?: (logId: string) => void;
  deleteProgramAssignment?: (assignmentId: string) => void;
}) {
  const progressLogs = dataLogs;
  const programAssignments = dataAssignments;
  const traineeAuditLogsData = useMemo(() => {
    return traineeAuditLogs.map((log) => ({
      ...log,
      trainee: trainee, // Link the trainee to the audit log
      // Only set updatedBy if it exists, otherwise leave as undefined
      updatedBy: log.updatedBy,
    }));
  }, [trainee, traineeAuditLogs]);
  const [concat, setConcat] = React.useState(true);

  const [tab, setTab] = React.useState("timeline");
  const [selectedEvent, setSelectedEvent] =
    React.useState<TimelineEvent | null>(null);

  // timelineEvents is memoized to avoid unnecessary recalculations
  const timelineEvents = React.useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add join event
    events.push({
      type: "join",
      date: new Date(trainee.created_at).toString(),
      member: trainee,
      createdBy:
        trainee.member?.firstname + " " + trainee.member?.lastname || "System",
    });

    // Add progress logs
    progressLogs.forEach((log) => {
      events.push({
        type: "progress_log",
        date: log.created_at,
        data: log,
        createdBy: log.created_by.firstname + " " + log.created_by.lastname,
      });
    });

    // Add program assignments
    programAssignments.forEach((assignment) => {
      events.push({
        type: "program_assignment",
        date: assignment.created_at,
        data: assignment,
        createdBy: assignment.assignedBy
          ? `${assignment.assignedBy.firstname} ${assignment.assignedBy.lastname}`
          : "System",
      });
    });

    // Add audit logs
    traineeAuditLogsData.forEach((log) => {
      events.push({
        type: "audit_log",
        date: log.created_at,
        data: log,
        createdBy: log.updatedBy
          ? `${log.updatedBy.firstname} ${log.updatedBy.lastname}`
          : "System",
      });
    });

    // Sort by date (newest first)
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [trainee, progressLogs, programAssignments, traineeAuditLogsData]);

  // Define columns for the table view
  const timelineColumns: ColumnDef<TimelineEvent>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: (value, row) => new Date(row.date).toLocaleDateString(),
      sortable: true,
    },
    {
      accessorKey: "type",
      filterable: true,
      filterConfig: {
        type: "select",
        options: [
          { value: "join", label: "Joined" },
          { value: "progress_log", label: "Progress Log" },
          { value: "program_assignment", label: "Program Assignment" },
          { value: "audit_log", label: "Audit Log" },
        ],
      },
      header: "Type",
      cell: (value) => {
        switch (value) {
          case "join":
            return "Joined";
          case "progress_log":
            return "Progress Log";
          case "program_assignment":
            return "Program Assignment";
          case "audit_log":
            return "Audit Log";
          default:
            return value as React.ReactNode;
        }
      },
      sortable: true,
    },
    {
      accessorKey: "summary",
      header: "Summary",
      cell: (_value, row) => {
        switch (row.type) {
          case "join":
            return `Joined the team: ${row.member.firstname} ${row.member.lastname}`;
          case "progress_log":
            return row.data.title;
          case "program_assignment":
            return row.data.program?.name || `Program ${row.data.program_id}`;
          case "audit_log":
            return "Profile Updated";
          default:
            return "";
        }
      },
    },
    // created_by
    {
      accessorKey: "created_by",
      header: "Created By",
      filterable: true,
      filterConfig: {
        type: "select",
        placeholder: "Search by creator",
        options: Array.from(
          new Set(
            timelineEvents.map((event) => event.createdBy).filter(Boolean)
          )
        ).map((creator) => ({
          value: creator,
          label: creator,
        })),
        getValue: (row) => row.createdBy,
      },
      cell: (value, row) => {
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{row.createdBy || "System"}</span>
          </div>
        );
      },
    },
    // view action
    {
      accessorKey: "",
      header: "View",
      cell: (_value, row) => (
        <Button
          variant="ghost"
          onClick={() => {
            // Set selected event to show details in dialog
            setSelectedEvent(row);
          }}
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  const renderTimelineEvent = (event: TimelineEvent) => {
    switch (event.type) {
      case "join":
        return <JoinEventCard event={event} />;
      case "progress_log":
        return (
          <ProgressLogCard
            event={event}
            deleteProgressLog={deleteProgressLog}
            concat={concat}
          />
        );
      case "program_assignment":
        return (
          <ProgramAssignmentCard
            event={event}
            deleteProgramAssignment={deleteProgramAssignment}
            concat={concat}
          />
        );
      case "audit_log":
        return <AuditLogCard event={event.data} concat={concat} />;
      default:
        return null;
    }
  };

  // Helper to render details in dialog
  const renderEventDetails = (event: TimelineEvent | null) => {
    if (!event) return null;
    switch (event.type) {
      case "join":
        return (
          <div>
            <h3 className="font-semibold mb-2">Joined the Team</h3>
            <div className="mb-2">
              <span className="font-medium">Date:</span>{" "}
              {new Date(event.date).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Name:</span>{" "}
              {event.member.firstname} {event.member.lastname}
            </div>
            <div>
              <span className="font-medium">Team:</span>{" "}
              {event.member.originalTeam}
            </div>
          </div>
        );
      case "progress_log":
        return (
          <div>
            <h3 className="font-semibold mb-2">{event.data.title}</h3>
            <div className="mb-2">
              <span className="font-medium">Date:</span>{" "}
              {new Date(event.date).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Created by:</span>{" "}
              {event.data.created_by.firstname} {event.data.created_by.lastname}
            </div>
            <div className="mt-2">
              <span className="font-medium">Description:</span>
              <div
                className="prose prose-sm mt-1"
                dangerouslySetInnerHTML={{ __html: event.data.description }}
              />
            </div>
            {event.data.programAssignment?.program?.name && (
              <div className="mt-2">
                <span className="font-medium">Program:</span>{" "}
                {event.data.programAssignment.program.name}
              </div>
            )}
          </div>
        );
      case "program_assignment":
        return (
          <div>
            <h3 className="font-semibold mb-2">
              {event.data.program?.name || `Program ${event.data.program_id}`}
            </h3>
            <div className="mb-2">
              <span className="font-medium">Assigned:</span>{" "}
              {new Date(event.date).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Assigned by:</span>{" "}
              {event.data.assignedBy?.firstname}{" "}
              {event.data.assignedBy?.lastname}
            </div>
            <div className="mt-2">
              <span className="font-medium">Notes:</span>
              <div
                className="prose prose-sm mt-1"
                dangerouslySetInnerHTML={{ __html: event.data.notes }}
              />
            </div>
            <div className="mt-2">
              <span className="font-medium">Status:</span>{" "}
              {event.data.done_at
                ? `Completed on ${new Date(
                    event.data.done_at
                  ).toLocaleDateString()}`
                : "In Progress"}
            </div>
          </div>
        );
      case "audit_log":
        return (
          <div>
            <h3 className="font-semibold mb-2">Profile Updated</h3>
            <div className="mb-2">
              <span className="font-medium">Date:</span>{" "}
              {new Date(event.date).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Updated by:</span>{" "}
              {event.data.updatedBy?.firstname} {event.data.updatedBy?.lastname}
            </div>
            <div className="mt-2">
              <span className="font-medium">Changes:</span>
              <ul className="list-disc ml-6">
                {Object.entries(event.data.changes).map(([field, change]) => (
                  <li key={field}>
                    <span className="font-medium">
                      {formatFieldName(field)}:
                    </span>{" "}
                    <span className="text-red-700 line-through">
                      {formatFieldValue(change.old, field)}
                    </span>{" "}
                    <span className="mx-1">→</span>
                    <span className="text-green-700">
                      {formatFieldValue(change.new, field)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="w-full h-full flex-1 flex flex-col min-h-0 p-6"
      >
        <TabsList className="">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="flex-1 min-h-0 ">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto sm:p-6 min-h-0 !p-2">
              <div className="relative w-full">
                {/* Timeline line */}
                <div className="absolute left-1 top-10 bottom-0 w-0.5 bg-border" />
                {/* Timeline events */}
                <div className="flex flex-col items-stretch">
                  {/* concat switch */}
                  <div className="flex items-center mb-4 w-full float-right">
                    <label className="flex items-center space-x-2">
                      <Switch
                        checked={concat}
                        onCheckedChange={(checked) => setConcat(checked)}
                        className="h-4 w-8"
                      />
                      <span className="text-sm">Concatenate Content</span>
                    </label>
                  </div>
                  <div className="flex-1 flex-col flex max-h-[67vh] overflow-auto space-y-6 md:space-y-4 ">
                    {timelineEvents.map((event, index) => (
                      <div
                        key={`${event.type}-${index}`}
                        className="relative flex items-start space-x-4"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-5 flex-shrink-0">
                          <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
                        </div>
                        {/* Event content */}
                        <div
                          className="flex-1 min-w-0 pb-2 pl-5"
                          onClick={() => {
                            setSelectedEvent(event);
                          }}
                        >
                          {renderTimelineEvent(event)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="table" className="flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-h-0 overflow-auto">
            <DataTable
              data={timelineEvents}
              columns={timelineColumns}
              pageSize={10}
              className="w-full flex-1"
              emptyMessage="No timeline events."
              maxHeight="50vh"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="!max-w-[80vw] !max-h-[80vh] w-full md:w-[50vw]">
          <DialogHeader>
            <DialogTitle>Timeline Event Details</DialogTitle>
          </DialogHeader>
          <div className="py-2 overflow-auto">
            {renderEventDetails(selectedEvent)}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="btn btn-outline" type="button">
                Close
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
