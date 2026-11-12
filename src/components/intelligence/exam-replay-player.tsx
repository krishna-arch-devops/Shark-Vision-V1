"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ExamReplayData, ReconstructedReplayEvent } from "@/features/intelligence/types/replay";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowLeft,
  Eye,
  Shuffle,
  Bookmark,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ExamReplayPlayerProps {
  replayData: ExamReplayData;
}

export function ExamReplayPlayer({ replayData }: ExamReplayPlayerProps) {
  const events = replayData.timelineEvents;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentEvent: ReconstructedReplayEvent | undefined = events[currentIndex];
  const currentQuestionMeta = currentEvent?.questionId
    ? replayData.questions[currentEvent.questionId]
    : null;

  // Formatter for elapsed time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Playback engine
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1500 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, events.length]);

  const handleNext = () => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Return Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/student/exams/${replayData.attemptId}/results`}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Results
        </Link>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
          {replayData.examCategory} Attempt Replay Engine
        </span>
      </div>

      {/* Replay Console Top Bar */}
      <Card className="p-6 border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Chronological Reconstruction
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Exam Replay: {replayData.examTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Step through your exact question navigation, revisit intervals, and option change decisions.
            </p>
          </div>

          {/* Time & Position Counter */}
          <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shrink-0">
            <Clock className="h-4 w-4 text-sky-600" />
            <span>
              {currentEvent ? formatTime(currentEvent.elapsedSeconds) : "00:00"} / {formatTime(replayData.totalDurationSeconds)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-sans text-xs">
              Event {currentIndex + 1} of {events.length}
            </span>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="pt-6">
          <input
            type="range"
            min={0}
            max={Math.max(0, events.length - 1)}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(Number(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />

          {/* Playback Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestart}
                title="Restart"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-24 font-bold"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-1.5 h-4 w-4 fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4 fill-current" />
                    Play
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex >= events.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Playback Speed Toggles */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-md transition",
                    playbackSpeed === spd
                      ? "bg-white text-sky-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Active Replay State Inspection Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question Inspection at Event Point */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                    Question Context At Action Point
                  </span>
                  <CardTitle className="text-lg mt-0.5">
                    {currentQuestionMeta
                      ? `Question #${currentQuestionMeta.questionOrder} • ${currentQuestionMeta.subjectName || "Subject"}`
                      : "Examination Event"}
                  </CardTitle>
                </div>
                {currentQuestionMeta?.topic && (
                  <Badge variant="outline">{currentQuestionMeta.topic}</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {currentQuestionMeta ? (
                <div className="space-y-4">
                  {/* Current Action Banner */}
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-sky-950">
                      Action: {currentEvent?.description}
                    </span>
                    <span className="font-mono text-sky-700">
                      Elapsed: {currentEvent ? formatTime(currentEvent.elapsedSeconds) : "--"}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                    {currentQuestionMeta.questionText}
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-2 pt-2">
                    {currentQuestionMeta.options.map((opt) => {
                      const isRecordedAtPoint =
                        currentEvent?.recordedAnswerAtPoint === opt.id;
                      const isCorrect =
                        replayData.resultsReleased &&
                        currentQuestionMeta.correctAnswer === opt.id;

                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border text-xs transition",
                            isRecordedAtPoint
                              ? "border-sky-600 bg-sky-50/60 font-semibold"
                              : "border-slate-200 bg-white"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-xs border",
                              isRecordedAtPoint
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-slate-50 text-slate-700 border-slate-300"
                            )}
                          >
                            {opt.id}
                          </span>
                          <span className="pt-0.5 text-slate-800">{opt.text}</span>
                          {isRecordedAtPoint && (
                            <span className="ml-auto text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                              Selected at Point
                            </span>
                          )}
                          {isCorrect && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Question Stats at Final */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase">Total Dwell</span>
                      <strong className="text-slate-900">
                        {Math.round(currentQuestionMeta.totalActiveTimeMs / 1000)}s
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase">Visits</span>
                      <strong className="text-slate-900">{currentQuestionMeta.visitCount}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase">Final Answer</span>
                      <strong className="text-slate-900">
                        {currentQuestionMeta.finalAnswer || "None"}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  <p className="font-semibold text-slate-800 text-sm">
                    {currentEvent?.description}
                  </p>
                  <p className="mt-1">
                    This was a macro examination lifecycle action (e.g. start, pause, submission).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Timeline Event Feed */}
        <div>
          <Card className="p-6 h-[600px] flex flex-col justify-between">
            <CardHeader className="p-0 mb-3 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm">Action Stream ({events.length} events)</CardTitle>
              <CardDescription className="text-xs">
                Click any action to jump the replay cursor directly
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto pr-1 space-y-2">
              {events.map((ev, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIndex(idx);
                    }}
                    className={cn(
                      "p-3 rounded-lg border text-xs cursor-pointer transition flex items-start justify-between gap-2",
                      isSelected
                        ? "border-sky-600 bg-sky-50 shadow-xs"
                        : "border-slate-100 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block leading-snug">
                        {ev.description}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Event #{ev.sequenceNum} • {ev.eventType}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 shrink-0">
                      {formatTime(ev.elapsedSeconds)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
