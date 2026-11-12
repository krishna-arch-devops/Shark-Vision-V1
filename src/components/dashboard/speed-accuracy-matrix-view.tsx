import React from "react";
import { SpeedAccuracyMatrix } from "@/features/analytics/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Zap, Clock, AlertTriangle, AlertCircle } from "lucide-react";

export interface SpeedAccuracyMatrixViewProps {
  matrix: SpeedAccuracyMatrix;
  onFilterCategory?: (category: string) => void;
}

export function SpeedAccuracyMatrixView({
  matrix,
  onFilterCategory,
}: SpeedAccuracyMatrixViewProps) {
  const totalClassified =
    matrix.fastCorrectCount +
    matrix.slowCorrectCount +
    matrix.fastIncorrectCount +
    matrix.slowIncorrectCount;

  const getPercentage = (count: number) => {
    return totalClassified > 0 ? Math.round((count / totalClassified) * 100) : 0;
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Speed-versus-Accuracy Matrix</CardTitle>
            <CardDescription>
              Classified against verified teacher target benchmarks. Identifies pacing vs concept gaps.
            </CardDescription>
          </div>
          {matrix.unknownSpeedCount > 0 && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Benchmark unavailable: {matrix.unknownSpeedCount}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Fast + Correct */}
          <div
            onClick={() => onFilterCategory?.("FAST_CORRECT")}
            className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition hover:bg-emerald-50 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Fast & Correct
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                {getPercentage(matrix.fastCorrectCount)}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-950">
              {matrix.fastCorrectCount}{" "}
              <span className="text-xs font-medium text-emerald-700">Questions</span>
            </div>
            <p className="mt-1 text-xs text-emerald-800/80">
              High speed with strong accuracy. Benchmark mastery demonstrated.
            </p>
          </div>

          {/* 2. Slow + Correct */}
          <div
            onClick={() => onFilterCategory?.("SLOW_CORRECT")}
            className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 transition hover:bg-sky-50 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                  Slow & Correct
                </span>
              </div>
              <span className="text-xs font-semibold text-sky-700">
                {getPercentage(matrix.slowCorrectCount)}%
              </span>
            </div>
            <div className="text-2xl font-black text-sky-950">
              {matrix.slowCorrectCount}{" "}
              <span className="text-xs font-medium text-sky-700">Questions</span>
            </div>
            <p className="mt-1 text-xs text-sky-800/80">
              Concepts understood, but solving pace can be optimized with calculation drills.
            </p>
          </div>

          {/* 3. Fast + Incorrect */}
          <div
            onClick={() => onFilterCategory?.("FAST_INCORRECT")}
            className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 transition hover:bg-amber-50 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Fast & Incorrect
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-700">
                {getPercentage(matrix.fastIncorrectCount)}%
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950">
              {matrix.fastIncorrectCount}{" "}
              <span className="text-xs font-medium text-amber-700">Questions</span>
            </div>
            <p className="mt-1 text-xs text-amber-800/80">
              Rushed or careless mistakes. Read problem stems more deliberately.
            </p>
          </div>

          {/* 4. Slow + Incorrect */}
          <div
            onClick={() => onFilterCategory?.("SLOW_INCORRECT")}
            className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 transition hover:bg-rose-50 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Slow & Incorrect
                </span>
              </div>
              <span className="text-xs font-semibold text-rose-700">
                {getPercentage(matrix.slowIncorrectCount)}%
              </span>
            </div>
            <div className="text-2xl font-black text-rose-950">
              {matrix.slowIncorrectCount}{" "}
              <span className="text-xs font-medium text-rose-700">Questions</span>
            </div>
            <p className="mt-1 text-xs text-rose-800/80">
              Critical time leak. High minutes invested resulting in negative marks.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
