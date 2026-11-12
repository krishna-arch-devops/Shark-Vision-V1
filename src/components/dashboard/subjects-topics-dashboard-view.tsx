import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubjectMetric, TopicMetric } from "@/features/analytics/types";
import { BookOpen, Layers, CheckCircle2, AlertCircle } from "lucide-react";

export interface SubjectsTopicsDashboardViewProps {
  subjects: SubjectMetric[];
  topics: TopicMetric[];
}

export function SubjectsTopicsDashboardView({
  subjects,
  topics,
}: SubjectsTopicsDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Subject Performance Strip */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-sky-600" />
          <span>Subject-Level Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <Card key={sub.subjectId} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900 text-base">{sub.subjectName}</span>
                <Badge variant="outline">{sub.subjectCode}</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Marks:</span>
                  <span className="font-bold text-slate-900">
                    {sub.marksObtained} / {sub.maximumMarks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accuracy:</span>
                  <span className="font-bold text-sky-700">
                    {sub.accuracyPercentage !== null ? `${sub.accuracyPercentage}%` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attempted:</span>
                  <span className="font-semibold text-slate-800">
                    {sub.attemptedQuestions} / {sub.totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Dwell:</span>
                  <span className="font-semibold text-slate-800">
                    {Math.round(sub.averageActiveTimeMs / 1000)}s
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Topic Weakness Heatmap / Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-600" />
          <span>Topic Diagnostic Index</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => {
            let badgeVariant: "success" | "warning" | "danger" | "outline" = "outline";
            if (t.classification === "STRONG") badgeVariant = "success";
            if (t.classification === "IMPROVING") badgeVariant = "warning";
            if (t.classification === "NEEDS_ATTENTION") badgeVariant = "danger";

            return (
              <Card key={t.topic} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-sm truncate">{t.topic}</span>
                    <Badge variant={badgeVariant} className="text-[10px]">
                      {t.classification.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{t.evidence}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Acc: <span className="font-bold text-slate-900">{t.accuracyPercentage !== null ? `${t.accuracyPercentage}%` : "N/A"}</span>
                  </span>
                  <span>
                    Attempts: <span className="font-bold text-slate-900">{t.attemptedQuestions}/{t.totalQuestions}</span>
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
