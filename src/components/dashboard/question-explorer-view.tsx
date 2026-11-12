"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompleteAttemptAnalytics } from "@/features/analytics/types";
import { Check, X, Clock, Eye, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface QuestionExplorerViewProps {
  analytics: CompleteAttemptAnalytics;
}

export function QuestionExplorerView({ analytics }: QuestionExplorerViewProps) {
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED" | "CHANGED">("ALL");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

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

  const toggleExpand = (qId: string) => {
    setExpandedQuestionId((prev) => (prev === qId ? null : qId));
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Question-by-Question Explorer</CardTitle>
            <CardDescription>
              Click any question to inspect the question statement, marked choice, correct key, and solution rationale.
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
            const isIncorrect = !isCorrect && !isUnanswered;
            const isExpanded = expandedQuestionId === q.questionId;

            return (
              <div
                key={q.questionId}
                className={cn(
                  "rounded-xl border transition overflow-hidden text-xs",
                  isExpanded
                    ? isIncorrect
                      ? "border-rose-300 ring-1 ring-rose-200 bg-rose-50/10"
                      : "border-sky-300 ring-1 ring-sky-200 bg-slate-50/30"
                    : isIncorrect
                    ? "border-rose-200/80 bg-white hover:border-rose-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                {/* Header Row (Clickable to Expand / Inspect) */}
                <div
                  onClick={() => toggleExpand(q.questionId)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  <div className="space-y-1.5 flex-1">
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

                      {q.topic && (
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                          {q.topic}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px]">
                      <span>
                        Final Choice:{" "}
                        <strong
                          className={cn(
                            "font-semibold",
                            isCorrect ? "text-emerald-700" : isIncorrect ? "text-rose-600 font-bold" : "text-slate-800"
                          )}
                        >
                          {q.finalAcceptedOption || "None"}
                        </strong>
                      </span>
                      {q.correctAnswer && isIncorrect && (
                        <span className="text-emerald-700 font-medium">
                          Correct: <strong className="font-bold">{q.correctAnswer}</strong>
                        </span>
                      )}
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

                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
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

                    <button
                      type="button"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      aria-label="Expand Question"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Question Review Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 animate-in fade-in duration-150">
                    {/* Question Statement */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Question Statement
                      </span>
                      <p className="text-sm font-medium text-slate-900 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
                        {q.questionText || "Question text not recorded in snapshot."}
                      </p>
                    </div>

                    {/* Answer Options with Marked (Red) and Correct (Green) Highlighting */}
                    {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Options & Responses
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {q.options.map((opt) => {
                            const isSelected = q.finalAcceptedOption === opt.id;
                            const isCorrectAnswer = q.correctAnswer === opt.id;

                            // Option styling rules:
                            // 1. Correct option is always highlighted in GREEN
                            // 2. Incorrect selected option is highlighted in RED
                            // 3. Otherwise standard neutral style
                            let cardStyle = "border-slate-200 bg-white text-slate-700";
                            let badgeLabel: string | null = null;
                            let badgeStyle = "";

                            if (isCorrectAnswer) {
                              cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-400";
                              badgeLabel = isSelected ? "Your Choice (Correct)" : "Correct Answer";
                              badgeStyle = "bg-emerald-600 text-white";
                            } else if (isSelected && !isCorrectAnswer) {
                              cardStyle = "border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-300";
                              badgeLabel = "Your Choice (Incorrect)";
                              badgeStyle = "bg-rose-600 text-white";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  "p-3 rounded-lg border transition flex items-start justify-between gap-3",
                                  cardStyle
                                )}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span
                                    className={cn(
                                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                      isCorrectAnswer
                                        ? "bg-emerald-600 text-white"
                                        : isSelected
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-100 text-slate-600"
                                    )}
                                  >
                                    {opt.id}
                                  </span>
                                  <span className="text-xs leading-relaxed pt-0.5">{opt.text}</span>
                                </div>

                                {badgeLabel && (
                                  <span
                                    className={cn(
                                      "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                      badgeStyle
                                    )}
                                  >
                                    {badgeLabel}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Diagnostic Summary & Solution Rationale */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          {isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : isIncorrect ? (
                            <AlertCircle className="h-4 w-4 text-rose-600" />
                          ) : (
                            <HelpCircle className="h-4 w-4 text-slate-400" />
                          )}
                          <span className={isCorrect ? "text-emerald-700" : isIncorrect ? "text-rose-700" : "text-slate-600"}>
                            {isCorrect
                              ? "Correct Response (+4 Marks awarded)"
                              : isIncorrect
                              ? `Incorrect Response (-1 Negative penalty) — Marked Option ${q.finalAcceptedOption}, but Option ${q.correctAnswer} is correct`
                              : "Question Unanswered (0 Marks)"}
                          </span>
                        </div>

                        {q.changeCount > 0 && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Answer modified {q.changeCount} time(s)
                          </span>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                            Solution & Explanation:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
