"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CompleteAttemptAnalytics } from "@/features/analytics/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface InteractiveMarksSimulatorProps {
  analytics: CompleteAttemptAnalytics;
  examTitle: string;
}

export function InteractiveMarksSimulator({
  analytics,
  examTitle,
}: InteractiveMarksSimulatorProps) {
  const ac = analytics.answerChangeIntelligence;
  const questions = ac.questions;

  // Selected question IDs to simulate reverting to first answer
  const [selectedToRevert, setSelectedToRevert] = useState<string[]>([]);

  const toggleRevertQuestion = (qId: string) => {
    setSelectedToRevert((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleRevertAll = () => {
    const changedIds = questions.filter((q) => q.changeCount > 0).map((q) => q.questionId);
    setSelectedToRevert(changedIds);
  };

  const handleReset = () => {
    setSelectedToRevert([]);
  };

  // Pure deterministic simulated score calculation
  const simulatedScore = questions.reduce((sum, q) => {
    if (selectedToRevert.includes(q.questionId)) {
      return sum + q.firstAnswerScore;
    }
    return sum + q.actualFinalScore;
  }, 0);

  const delta = simulatedScore - ac.actualTotalScore;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Return Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/student/exams/${analytics.attemptId}/results`}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Results
        </Link>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
          Interactive Marks Recovery Simulator
        </span>
      </div>

      {/* Main Simulation Banner */}
      <Card className="p-6 border-sky-200 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Counterfactual What-If Model
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {examTitle}
            </h1>
            <p className="text-xs text-slate-600 max-w-xl">
              Simulate toggling individual question answers back to your initial instincts to understand the exact point delta caused by revision decisions.
            </p>
          </div>

          <div className="flex items-center gap-6 sm:border-l sm:border-slate-200 sm:pl-8 shrink-0">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Actual Score</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {ac.actualTotalScore}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Simulated Score</span>
              <div
                className={cn(
                  "text-3xl sm:text-4xl font-black",
                  delta > 0
                    ? "text-emerald-600"
                    : delta < 0
                    ? "text-rose-600"
                    : "text-slate-900"
                )}
              >
                {simulatedScore}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <span className="text-xs font-semibold text-slate-400 uppercase">Net Delta</span>
              <div
                className={cn(
                  "text-xl font-bold flex items-center gap-1",
                  delta > 0
                    ? "text-emerald-600"
                    : delta < 0
                    ? "text-rose-600"
                    : "text-slate-500"
                )}
              >
                {delta > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                <span>{delta > 0 ? `+${delta}` : delta} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Currently simulating <strong>{selectedToRevert.length}</strong> question(s) reverted to first recorded choice.
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRevertAll}>
              Revert All to First Answers
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={selectedToRevert.length === 0}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset Simulation
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Question Cards */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Questions with Answer Modifications ({questions.filter((q) => q.changeCount > 0).length})</CardTitle>
          <CardDescription>
            Select a question to toggle its state between your initial recorded option and final accepted submission.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {questions
              .filter((q) => q.changeCount > 0)
              .map((q) => {
                const isReverted = selectedToRevert.includes(q.questionId);
                const activeOption = isReverted ? q.firstSelectedOption : q.finalAcceptedOption;
                const activeScore = isReverted ? q.firstAnswerScore : q.actualFinalScore;
                const changeDelta = q.firstAnswerScore - q.actualFinalScore;

                return (
                  <div
                    key={q.questionId}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Question ID: {q.questionId.slice(0, 8)}...
                        </span>
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
                        Initial Choice: <strong className="text-slate-800">{q.firstSelectedOption}</strong> ──▶ Final Accepted: <strong className="text-slate-800">{q.finalAcceptedOption}</strong> ({q.changeCount} change(s))
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase block">First-Answer Delta</span>
                        <span
                          className={cn(
                            "font-bold",
                            changeDelta > 0
                              ? "text-emerald-600"
                              : changeDelta < 0
                              ? "text-rose-600"
                              : "text-slate-500"
                          )}
                        >
                          {changeDelta > 0 ? `+${changeDelta}` : changeDelta} pts
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant={isReverted ? "primary" : "outline"}
                        onClick={() => toggleRevertQuestion(q.questionId)}
                        className="w-36 text-xs font-semibold"
                      >
                        {isReverted ? "Simulating First (Reverted)" : "Simulate First Choice"}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
