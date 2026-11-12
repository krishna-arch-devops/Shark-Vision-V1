"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  StudentExamQuestion,
  QuestionOptionItem,
} from "@/types/database";
import { StudentExamSession } from "@/lib/exam/engine";
import { useExamTimerAndEvents } from "@/lib/exam/use-exam-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StudentExamWorkspaceProps {
  session: StudentExamSession;
}

export function StudentExamWorkspace({ session }: StudentExamWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Local state for answers & review flags
  const [responses, setResponses] = useState<
    Record<string, { selected_option: string | null; is_marked_for_review: boolean; is_visited: boolean }>
  >(() => {
    const init: Record<string, { selected_option: string | null; is_marked_for_review: boolean; is_visited: boolean }> = {};
    session.questions.forEach((q: StudentExamQuestion, idx: number) => {
      const saved = session.savedResponses[q.question_id];
      init[q.question_id] = {
        selected_option: saved?.selected_option || null,
        is_marked_for_review: saved?.is_marked_for_review || false,
        is_visited: idx === 0 || !!saved,
      };
    });
    return init;
  });

  const currentQuestion: StudentExamQuestion = session.questions[currentIndex];

  // Submission handler
  const handleSubmitExam = useCallback(async () => {
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: session.attempt.id }),
      });

      if (res.ok) {
        startTransition(() => {
          router.push(`/student/examinations/confirmed?attemptId=${session.attempt.id}`);
        });
      }
    } catch (err) {
      console.error("Submission failed", err);
    }
  }, [router, session.attempt.id]);

  // Hook for monotonic question dwell timing & event log
  const {
    secondsRemaining,
    syncStatus,
    setSyncStatus,
    dispatchEvent,
    recordQuestionEnter,
    recordQuestionExit,
    getQuestionActiveTimeMs,
    setInitialQuestionTime,
  } = useExamTimerAndEvents({
    attemptId: session.attempt.id,
    currentQuestionId: currentQuestion?.question_id || null,
    serverDeadline: session.examination.server_deadline,
    onAutoSubmit: handleSubmitExam,
  });

  // Seed existing active times from server
  useEffect(() => {
    session.questions.forEach((q: StudentExamQuestion) => {
      const saved = session.savedResponses[q.question_id];
      if (saved?.active_time_ms) {
        setInitialQuestionTime(q.question_id, saved.active_time_ms);
      }
    });
    dispatchEvent("EXAM_STARTED", currentQuestion?.question_id);
  }, []);

  // Save response to server
  const persistResponse = useCallback(
    async (qId: string, option: string | null, isReview: boolean) => {
      setSyncStatus("SAVING");
      const activeMs = Math.round(getQuestionActiveTimeMs(qId));

      try {
        const res = await fetch("/api/exam/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: session.attempt.id,
            questionId: qId,
            selectedOption: option,
            isMarkedForReview: isReview,
            activeTimeMs: activeMs,
          }),
        });

        if (res.ok) {
          setSyncStatus("SAVED");
        } else {
          setSyncStatus("OFFLINE");
        }
      } catch {
        setSyncStatus("OFFLINE");
      }
    },
    [session.attempt.id, getQuestionActiveTimeMs, setSyncStatus]
  );

  // Navigate question
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex === currentIndex || targetIndex < 0 || targetIndex >= session.questions.length) {
      return;
    }

    const prevQ = session.questions[currentIndex];
    const nextQ = session.questions[targetIndex];

    recordQuestionExit(prevQ.question_id);

    // Save previous state to server
    const currentResp = responses[prevQ.question_id];
    persistResponse(prevQ.question_id, currentResp?.selected_option || null, currentResp?.is_marked_for_review || false);

    setResponses((prev) => ({
      ...prev,
      [nextQ.question_id]: {
        ...prev[nextQ.question_id],
        is_visited: true,
      },
    }));

    const isRevisit = responses[nextQ.question_id]?.is_visited || false;
    recordQuestionEnter(nextQ.question_id, isRevisit);

    setCurrentIndex(targetIndex);
    setMobilePaletteOpen(false);
  };

  // Option selection
  const handleSelectOption = (optionId: "A" | "B" | "C" | "D") => {
    const qId = currentQuestion.question_id;
    const currentSelected = responses[qId]?.selected_option;

    if (currentSelected === optionId) return;

    const eventType = currentSelected ? "ANSWER_CHANGED" : "ANSWER_SELECTED";
    dispatchEvent(eventType, qId, {
      fromOption: currentSelected,
      toOption: optionId,
    });

    const isReview = responses[qId]?.is_marked_for_review || false;

    setResponses((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selected_option: optionId,
        is_visited: true,
      },
    }));

    persistResponse(qId, optionId, isReview);
  };

  // Clear response
  const handleClearResponse = () => {
    const qId = currentQuestion.question_id;
    const currentSelected = responses[qId]?.selected_option;

    if (!currentSelected) return;

    dispatchEvent("ANSWER_CLEARED", qId, { clearedOption: currentSelected });
    const isReview = responses[qId]?.is_marked_for_review || false;

    setResponses((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selected_option: null,
      },
    }));

    persistResponse(qId, null, isReview);
  };

  // Mark for review toggle
  const handleToggleReview = () => {
    const qId = currentQuestion.question_id;
    const currentlyMarked = responses[qId]?.is_marked_for_review || false;
    const nextMarked = !currentlyMarked;

    dispatchEvent(
      nextMarked ? "QUESTION_MARKED_FOR_REVIEW" : "QUESTION_UNMARKED_FOR_REVIEW",
      qId
    );

    const currentOption = responses[qId]?.selected_option || null;

    setResponses((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        is_marked_for_review: nextMarked,
      },
    }));

    persistResponse(qId, currentOption, nextMarked);
  };

  // Stats for palette
  const answeredCount = Object.values(responses).filter((r) => r.selected_option !== null).length;
  const markedReviewCount = Object.values(responses).filter((r) => r.is_marked_for_review).length;
  const unansweredCount = session.questions.length - answeredCount;

  // Format timer
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSelectedOption = responses[currentQuestion.question_id]?.selected_option;
  const isCurrentMarkedReview = responses[currentQuestion.question_id]?.is_marked_for_review;

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900 select-none">
      {/* Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 font-black text-white text-xs">
            SV
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {session.examination.title}
            </h1>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              {session.examination.category} • Total Marks: {session.examination.total_marks}
            </span>
          </div>
        </div>

        {/* Sync & Timer Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                syncStatus === "SAVED" && "bg-emerald-500",
                syncStatus === "SAVING" && "bg-amber-400 animate-pulse",
                syncStatus === "OFFLINE" && "bg-rose-500"
              )}
            />
            <span>{syncStatus === "SAVED" ? "Saved" : syncStatus === "SAVING" ? "Saving..." : "Pending Sync"}</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200 text-slate-900 font-mono text-sm font-semibold">
            <Clock className="h-4 w-4 text-sky-600" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="font-semibold"
          >
            Submit Exam
          </Button>

          <button
            onClick={() => setMobilePaletteOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open Question Palette"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Reading & Answering Canvas */}
        <main className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white">
          <div className="max-w-4xl mx-auto w-full">
            {/* Question Meta Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                  Question {currentIndex + 1} of {session.questions.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Marks: +{currentQuestion.marks} / -{currentQuestion.negative_marks}
                </span>
              </div>

              {isCurrentMarkedReview && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Bookmark className="h-3 w-3 fill-amber-500" />
                  <span>Marked for Review</span>
                </Badge>
              )}
            </div>

            {/* Question Text */}
            <div className="text-base text-slate-900 font-medium leading-relaxed mb-6 whitespace-pre-line">
              {currentQuestion.question_text}
            </div>

            {/* Optional Image */}
            {currentQuestion.image_url && (
              <div className="mb-6 rounded-lg border border-slate-200 p-2 max-w-lg bg-slate-50">
                <img
                  src={currentQuestion.image_url}
                  alt="Question Diagram"
                  className="rounded object-contain max-h-64"
                />
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((opt: QuestionOptionItem) => {
                const isSelected = currentSelectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={cn(
                      "w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                      isSelected
                        ? "border-sky-600 bg-sky-50/60 ring-1 ring-sky-600"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs border transition-colors",
                        isSelected
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white text-slate-700 border-slate-300"
                      )}
                    >
                      {opt.id}
                    </span>
                    <span className="text-sm text-slate-800 font-normal leading-relaxed pt-0.5">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bottom Bar */}
          <div className="border-t border-slate-100 pt-4 max-w-4xl mx-auto w-full flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleReview}
                className={cn(isCurrentMarkedReview && "border-amber-400 bg-amber-50 text-amber-800")}
              >
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                {isCurrentMarkedReview ? "Unmark Review" : "Mark for Review"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearResponse}
                disabled={!currentSelectedOption}
                className="text-slate-600"
              >
                Clear Response
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <Button
                size="sm"
                onClick={() => goToQuestion(currentIndex + 1)}
                disabled={currentIndex === session.questions.length - 1}
              >
                Save & Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Desktop Sidebar: Question Palette & Legend */}
        <aside className="hidden lg:flex w-80 flex-col border-l border-slate-200 bg-slate-50/50 p-6 overflow-y-auto">
          {/* Status Counts */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Answered</span>
              <p className="text-lg font-bold text-emerald-600">{answeredCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Unanswered</span>
              <p className="text-lg font-bold text-slate-600">{unansweredCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-center shadow-xs col-span-2">
              <span className="text-xs text-slate-500 font-medium">Marked for Review</span>
              <p className="text-lg font-bold text-amber-600">{markedReviewCount}</p>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Question Palette
          </h3>

          {/* Question Grid Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {session.questions.map((q: StudentExamQuestion, idx: number) => {
              const resp = responses[q.question_id];
              const isAnswered = resp?.selected_option !== null && resp?.selected_option !== undefined;
              const isReview = resp?.is_marked_for_review;
              const isVisited = resp?.is_visited;
              const isCurrent = idx === currentIndex;

              let btnClass = "border-slate-300 bg-white text-slate-700"; // Not visited
              if (isVisited && !isAnswered && !isReview) {
                btnClass = "border-rose-300 bg-rose-50 text-rose-700"; // Visited unanswered
              }
              if (isAnswered && !isReview) {
                btnClass = "border-emerald-600 bg-emerald-600 text-white"; // Answered
              }
              if (isReview && !isAnswered) {
                btnClass = "border-amber-400 bg-amber-100 text-amber-800"; // Marked review
              }
              if (isReview && isAnswered) {
                btnClass = "border-violet-600 bg-violet-600 text-white"; // Answered & Marked
              }

              return (
                <button
                  key={q.question_id}
                  onClick={() => goToQuestion(idx)}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold transition shadow-xs",
                    btnClass,
                    isCurrent && "ring-2 ring-sky-500 ring-offset-1 scale-105"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 text-[11px] text-slate-600 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-emerald-600" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm border border-rose-300 bg-rose-50" />
              <span>Visited, Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm border border-slate-300 bg-white" />
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-violet-600" />
              <span>Answered & Marked for Review</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Palette */}
      {mobilePaletteOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/50 backdrop-blur-xs lg:hidden">
          <div className="ml-auto h-full w-72 bg-white p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Question Palette</h3>
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {session.questions.map((q: StudentExamQuestion, idx: number) => {
                  const resp = responses[q.question_id];
                  const isAnswered = resp?.selected_option !== null && resp?.selected_option !== undefined;
                  const isReview = resp?.is_marked_for_review;

                  let btnClass = "border-slate-300 bg-white text-slate-700";
                  if (isAnswered && !isReview) btnClass = "border-emerald-600 bg-emerald-600 text-white";
                  if (isReview) btnClass = "border-amber-400 bg-amber-100 text-amber-800";

                  return (
                    <button
                      key={q.question_id}
                      onClick={() => goToQuestion(idx)}
                      className={cn(
                        "flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold",
                        btnClass,
                        idx === currentIndex && "ring-2 ring-sky-500"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setMobilePaletteOpen(false);
                setShowSubmitModal(true);
              }}
              className="w-full mt-4"
            >
              Submit Examination
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Confirm Examination Submission
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to finish and submit your test? Once submitted, no further responses can be altered.
            </p>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-900">{session.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Answered Questions:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered Questions:</span>
                <span className="font-bold text-slate-700">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marked for Review:</span>
                <span className="font-bold text-amber-600">{markedReviewCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                disabled={isPending}
              >
                Continue Test
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSubmitExam}
                isLoading={isPending}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Yes, Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
