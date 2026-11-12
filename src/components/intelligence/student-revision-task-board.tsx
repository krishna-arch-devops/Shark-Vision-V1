"use client";

import React, { useTransition } from "react";
import { toggleRevisionTaskStatusAction } from "@/features/intelligence/actions/revision-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Bookmark, ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RevisionPlanProps {
  plan: any;
  tasks: any[];
}

export function StudentRevisionTaskBoard({ plan, tasks }: RevisionPlanProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    startTransition(async () => {
      await toggleRevisionTaskStatusAction(taskId, nextStatus);
    });
  };

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Plan Header Card */}
      <Card className="p-6 border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">ACTIVE REVISION AGENDA</Badge>
              <span className="text-xs text-slate-400">Created: {new Date(plan.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{plan.description}</p>
          </div>

          <div className="sm:border-l sm:border-slate-100 sm:pl-6 shrink-0">
            <span className="text-xs font-semibold text-slate-400 uppercase">Progress</span>
            <div className="text-2xl font-black text-sky-700 mt-0.5">
              {completedCount} / {tasks.length}{" "}
              <span className="text-xs font-normal text-slate-500">Tasks ({progressPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-4">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Recommended Action Items
        </h3>

        {tasks.map((task) => {
          const isCompleted = task.status === "COMPLETED";

          return (
            <Card
              key={task.id}
              className={cn(
                "p-4 transition hover:border-slate-300",
                isCompleted ? "bg-slate-50/60 border-slate-200 opacity-75" : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    disabled={isPending}
                    className="mt-0.5 text-slate-400 hover:text-sky-600 transition"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          "font-bold text-sm",
                          isCompleted ? "line-through text-slate-400" : "text-slate-900"
                        )}
                      >
                        {task.title}
                      </h4>
                      <Badge
                        variant={
                          task.priority === "HIGH"
                            ? "danger"
                            : task.priority === "MEDIUM"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {task.task_type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      {task.description}
                    </p>

                    {task.topic && (
                      <span className="inline-block text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        Topic: {task.topic}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    className="text-xs font-semibold text-sky-700 hover:underline"
                  >
                    {isCompleted ? "Mark Uncompleted" : "Mark Done"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
