import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnswerChangeSummary } from "@/features/analytics/types";
import { Shuffle, ArrowRight, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

export interface AnswerChangeDashboardViewProps {
  summary: AnswerChangeSummary;
}

export function AnswerChangeDashboardView({ summary }: AnswerChangeDashboardViewProps) {
  const isNetPositive = summary.netImpactMarks > 0;
  const isNetNegative = summary.netImpactMarks < 0;

  return (
    <div className="space-y-6">
      {/* Counterfactual Marks Simulator Banner */}
      <Card className="border-sky-200 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/30 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded">
                Decision Marks Simulator
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              First Selected Answer Scenario
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Deterministic calculation: If every initial answer choice had been retained without modifications, your score would be{" "}
              <span className="font-bold text-slate-900">{summary.hypotheticalFirstAnswerScore}</span> (vs actual{" "}
              <span className="font-bold text-slate-900">{summary.actualTotalScore}</span>).
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Net Change Impact
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isNetPositive ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : isNetNegative ? (
                <TrendingDown className="h-5 w-5 text-rose-600" />
              ) : (
                <Shuffle className="h-5 w-5 text-slate-400" />
              )}
              <span
                className={`text-2xl font-black ${
                  isNetPositive
                    ? "text-emerald-700"
                    : isNetNegative
                    ? "text-rose-700"
                    : "text-slate-700"
                }`}
              >
                {summary.netImpactMarks > 0 ? `+${summary.netImpactMarks}` : summary.netImpactMarks} Marks
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Total Answer Changes</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{summary.totalAnswerChanges}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Answers Cleared</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{summary.totalAnswerClears}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Marks Gained (Inc to Cor)</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">+{summary.marksGainedFromChanges}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500">Marks Lost (Cor to Inc)</span>
          <p className="text-xl font-bold text-rose-600 mt-1">-{summary.marksLostFromChanges}</p>
        </div>
      </div>

      {/* Question Changes List */}
      <Card>
        <CardHeader>
          <CardTitle>Question-Level Decision History</CardTitle>
          <CardDescription>
            Chronological inspection of candidate choice modifications and point shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.questions.filter((q) => q.changeCount > 0 || q.clearCount > 0).length > 0 ? (
            <div className="divide-y divide-slate-100">
              {summary.questions
                .filter((q) => q.changeCount > 0 || q.clearCount > 0)
                .map((q) => (
                  <div
                    key={q.questionId}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Question ID: {q.questionId.slice(0, 8)}...</span>
                        <Badge
                          variant={
                            q.classification === "INCORRECT_TO_CORRECT"
                              ? "success"
                              : q.classification === "CORRECT_TO_INCORRECT"
                              ? "danger"
                              : "outline"
                          }
                        >
                          {q.classification.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-slate-500">
                        First Selection: <span className="font-semibold">{q.firstSelectedOption || "None"}</span> ──▶ Final Accepted: <span className="font-semibold">{q.finalAcceptedOption || "None"}</span> ({q.changeCount} change(s))
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[11px]">Marks Impact</span>
                      <p
                        className={`font-bold ${
                          q.marksDelta > 0
                            ? "text-emerald-600"
                            : q.marksDelta < 0
                            ? "text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        {q.marksDelta > 0 ? `+${q.marksDelta}` : q.marksDelta} pts
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              <Shuffle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <span>No answer choices were modified in this examination. First selections were preserved.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
