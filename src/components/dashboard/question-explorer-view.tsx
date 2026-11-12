import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompleteAttemptAnalytics } from "@/features/analytics/types";
import { Check, X, Clock, HelpCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface QuestionExplorerViewProps {
  analytics: CompleteAttemptAnalytics;
}

export function QuestionExplorerView({ analytics }: QuestionExplorerViewProps) {
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED" | "CHANGED">("ALL");

  const questions = analytics.answerChangeIntelligence.questions;
  const timeMap = new Map(analytics.timeIntelligence.questions.map((q) => [q.questionId, q]));
  const speedMap = new Map(analytics.speedAccuracyMatrix.items.map((q) => [q.questionId, q]));

  const filteredQuestions = questions.filter((q) => {
    if (filter === "CORRECT") return q.finalAnswerCorrect;
    if (filter === "INCORRECT") return !q.finalAnswerCorrect && q.finalAcceptedOption !== null;
    if (filter === "UNANSWERED") return q.finalAcceptedOption === null;
    if (filter === "CHANGED") return q.changeCount > 0;
    return true;
  });

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Question-by-Question Explorer</CardTitle>
            <CardDescription>
              Detailed behavioral dwell time, final answers, and points earned per item
            </CardDescription>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "CORRECT", "INCORRECT", "UNANSWERED", "CHANGED"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition",
                  filter === mode
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => {
            const timeData = timeMap.get(q.questionId);
            const speedData = speedMap.get(q.questionId);
            const isCorrect = q.finalAnswerCorrect;
            const isUnanswered = q.finalAcceptedOption === null;

            return (
              <div
                key={q.questionId}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Question #{idx + 1}
                    </span>
                    <Badge
                      variant={
                        isUnanswered
                          ? "outline"
                          : isCorrect
                          ? "success"
                          : "danger"
                      }
                    >
                      {isUnanswered ? "Unanswered" : isCorrect ? "Correct" : "Incorrect"}
                    </Badge>

                    {speedData && speedData.category !== "UNKNOWN" && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {speedData.category.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px]">
                    <span>
                      Final Choice: <strong className="text-slate-800">{q.finalAcceptedOption || "None"}</strong>
                    </span>
                    <span>
                      Dwell Time: <strong className="text-slate-800">{timeData ? Math.round(timeData.totalActiveTimeMs / 1000) : 0}s</strong>
                    </span>
                    <span>
                      Visits: <strong className="text-slate-800">{timeData?.visitCount || 1}</strong>
                    </span>
                    <span>
                      Changes: <strong className="text-slate-800">{q.changeCount}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4 shrink-0">
                  <span className="text-slate-400 text-[10px] uppercase">Marks</span>
                  <p
                    className={`text-base font-bold ${
                      q.actualFinalScore > 0
                        ? "text-emerald-600"
                        : q.actualFinalScore < 0
                        ? "text-rose-600"
                        : "text-slate-600"
                    }`}
                  >
                    {q.actualFinalScore > 0 ? `+${q.actualFinalScore}` : q.actualFinalScore}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
