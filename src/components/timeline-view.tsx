"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "lucide-react";
import { ProgramAssignment, ProgressLog, Trainee } from "@/models/trainee";

interface JoinEvent {
  type: "join";
  date: string;
  member: Trainee;
}

interface ProgressLogEvent {
  type: "progress_log";
  date: string;
  data: ProgressLog;
}

interface ProgramAssignmentEvent {
  type: "program_assignment";
  date: string;
  data: ProgramAssignment;
}

type TimelineEvent = JoinEvent | ProgressLogEvent | ProgramAssignmentEvent;

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
}: {
  event: ProgressLogEvent;
  deleteProgressLog: (logId: string) => void;
}) {
  return (
    <Card className="border-l-4 border-l-green-500 w-full">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold leading-tight mb-2">
                {event.data.title}
              </CardTitle>
              <CardDescription className="space-y-2 sm:space-y-0">
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
                      {event.data.created_by.firstname}{" "}
                      {event.data.created_by.lastname}
                    </span>
                  </div>
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center space-x-2">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-xs"
            >
              Progress Log
            </Badge>
            {/* Delete Progress log */}
            <button
              className="text-red-400 hover:text-red-800 text-xs sm:text-sm "
              onClick={() => {
                deleteProgressLog(event.data.id);
              }}
            >
              <Trash className="h-4 w-4 inline-block mr-1" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {event.data.description}
        </p>
      </CardContent>
    </Card>
  );
}

function ProgramAssignmentCard({
  event,
  deleteProgramAssignment,
}: {
  event: ProgramAssignmentEvent;
  deleteProgramAssignment: (assignmentId: string) => void;
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
    <Card className={`border-l-4 ${borderColor} w-full`}>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <div className={`p-2 ${iconBgColor} rounded-full flex-shrink-0`}>
              {isCompleted ? (
                <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
              ) : (
                <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold leading-tight mb-2">
                {event.data.program?.name || `Program ${event.data.program_id}`}
              </CardTitle>
              <CardDescription className="space-y-2 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>
                      Assigned {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">
                      {event.data.assignedBy?.firstname}{" "}
                      {event.data.assignedBy?.lastname}
                    </span>
                  </div>
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant={badgeVariant} className="text-xs">
              {badgeText}
            </Badge>
            {/* Delete Progress log */}
            <button
              className="text-red-400 hover:text-red-800 text-xs sm:text-sm "
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
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {event.data.notes}
        </p>

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
    </Card>
  );
}

// Main Timeline Component
export function TimelineView({
  trainee,
  dataLogs = [],
  dataAssignments = [],
  deleteProgressLog = () => {},
  deleteProgramAssignment = () => {},
}: {
  trainee: Trainee;
  dataLogs: ProgressLog[];
  dataAssignments: ProgramAssignment[];
  deleteProgressLog?: (logId: string) => void;
  deleteProgramAssignment?: (assignmentId: string) => void;
}) {
  const progressLogs = dataLogs;
  const programAssignments = dataAssignments;

  const timelineEvents = React.useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add join event
    events.push({
      type: "join",
      date: new Date(trainee.created_at).toString(),
      member: trainee,
    });

    // Add progress logs
    progressLogs.forEach((log) => {
      events.push({
        type: "progress_log",
        date: log.created_at,
        data: log,
      });
    });

    // Add program assignments
    programAssignments.forEach((assignment) => {
      events.push({
        type: "program_assignment",
        date: assignment.created_at,
        data: assignment,
      });
    });

    // Sort by date (newest first)
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [trainee, progressLogs, programAssignments]);

  const renderTimelineEvent = (event: TimelineEvent) => {
    switch (event.type) {
      case "join":
        return <JoinEventCard event={event} />;
      case "progress_log":
        return (
          <ProgressLogCard
            event={event}
            deleteProgressLog={deleteProgressLog}
          />
        );
      case "program_assignment":
        return (
          <ProgramAssignmentCard
            event={event}
            deleteProgramAssignment={deleteProgramAssignment}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable Timeline Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ position: "relative", maxHeight: "700px" }}
      >
        <div className="p-6">
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline events */}
            <div className="space-y-6 ml-5">
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
                  <div className="flex-1 min-w-0 pb-2 pl-5">
                    {renderTimelineEvent(event)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
