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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  FileText,
  BookOpen,
  CheckCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import { ProgramAssignment, ProgressLog, Trainee } from "@/models/trainee";

// Type definitions matching your requirements
interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  originalTeam: string;
  active: boolean;
  joinDate: string;
  avatar?: string;
}

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

// Timeline Event Components
function JoinEventCard({ event }: { event: JoinEvent }) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Joined the Team</CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {event.member.firstname.charAt(0)}
              {event.member.lastname.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {event.member.firstname} {event.member.lastname}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.member.originalTeam}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressLogCard({ event }: { event: ProgressLogEvent }) {
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{event.data.title}</CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>
                    by{" "}
                    {`${
                      (event.data.created_by as unknown as Member).firstname
                    } ${(event.data.created_by as unknown as Member).lastname}`}
                  </span>
                </div>
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Progress Log
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {event.data.description}
        </p>
      </CardContent>
    </Card>
  );
}

function ProgramAssignmentCard({ event }: { event: ProgramAssignmentEvent }) {
  const isCompleted = event.data.done_at !== null;
  const borderColor = isCompleted
    ? "border-l-purple-500"
    : "border-l-orange-500";
  const iconBgColor = isCompleted ? "bg-purple-100" : "bg-orange-100";
  const iconColor = isCompleted ? "text-purple-600" : "text-orange-600";
  const badgeVariant = isCompleted ? "secondary" : "default";
  const badgeText = isCompleted ? "Completed" : "In Progress";

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${iconBgColor} rounded-full`}>
              {isCompleted ? (
                <CheckCircle className={`h-5 w-5 ${iconColor}`} />
              ) : (
                <BookOpen className={`h-5 w-5 ${iconColor}`} />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {event.data.program
                  ? event.data.program.name
                  : `Program ${event.data.program_id}`}
              </CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>
                    by{" "}
                    {`${event.data.assignedBy?.firstname} ${event.data.assignedBy?.lastname}`}
                  </span>
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={badgeVariant}>{badgeText}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {event.data.notes}
        </p>

        {isCompleted && (
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">
              Completed on {new Date(event.data.done_at!).toLocaleDateString()}
            </span>
          </div>
        )}

        {!isCompleted && (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-orange-600" />
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
}: {
  trainee: Trainee;
  dataLogs: ProgressLog[];
  dataAssignments: ProgramAssignment[];
}) {
  const [member] = React.useState<Trainee>(trainee);
  const progressLogs = dataLogs;
  const programAssignments = dataAssignments;

  // Create timeline events and sort by date
  const daysJoined = React.useMemo(() => {
    const joinDate = new Date(trainee.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joinDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  }, [trainee.created_at]);

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
  }, [member, progressLogs, programAssignments]);

  const renderTimelineEvent = (event: TimelineEvent) => {
    switch (event.type) {
      case "join":
        return <JoinEventCard event={event} />;
      case "progress_log":
        return <ProgressLogCard event={event} />;
      case "program_assignment":
        return <ProgramAssignmentCard event={event} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Timeline Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Timeline</h2>
            <p className="text-muted-foreground">
              Complete history of {member.firstname}'s journey and progress
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {timelineEvents.filter((e) => e.type === "join").length} Join
              Event
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              {timelineEvents.filter((e) => e.type === "progress_log").length}{" "}
              Progress Logs
            </Badge>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              {
                timelineEvents.filter((e) => e.type === "program_assignment")
                  .length
              }{" "}
              Program Assignments
            </Badge>
          </div>
        </div>
      </div>

      {/* Scrollable Timeline Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ position: "relative", maxHeight: "400px" }}
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

      {/* Fixed Timeline Summary */}
      <div className="flex-shrink-0 p-6 border-t">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {daysJoined}
                </div>
                <div className="text-sm text-muted-foreground">
                  Days since joining
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {progressLogs.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Progress logs recorded
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {programAssignments.filter((a) => a.done_at !== null).length}/
                  {programAssignments.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Programs completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
