import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TimeIntelligenceSummary, PerformanceOverview } from "@/features/analytics/types";
import { Clock, Eye, RotateCcw, AlertTriangle } from "lucide-react";

export interface TimeIntelligenceDashboardViewProps {
  timeSummary: TimeIntelligenceSummary;
  performance: PerformanceOverview;
}

export function TimeIntelligenceDashboardView({
  timeSummary,
  performance,
}: TimeIntelligenceDashboardViewProps) {
  const formatSec = (ms: number) => Math.round(ms / 1000);
  const formatMin = (ms: number) => (ms / (1000 * 60)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Dwell Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-emerald-100 bg-emerald-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-emerald-800">
              Active Time on Correct Questions
            </span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">
            {formatMin(timeSummary.totalActiveTimeCorrectMs)}{" "}
            <span className="text-xs font-medium text-emerald-700">Mins</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">High conversion time investment</p>
        </Card>

        <Card className="p-5 border-rose-100 bg-rose-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-rose-800">
              Active Time on Incorrect Questions
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">
            {formatMin(timeSummary.totalActiveTimeIncorrectMs)}{" "}
            <span className="text-xs font-medium text-rose-700">Mins</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dwell minutes that yielded negative marks</p>
        </Card>

        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-600">
              Average Dwell Per Attempted
            </span>
            <Eye className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatSec(performance.averageActiveTimePerAttemptedMs)}{" "}
            <span className="text-xs font-medium text-slate-500">Sec / Question</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Median: {formatSec(performance.medianQuestionTimeMs)}s</p>
        </Card>
      </div>

      {/* Question Dwell Time Distribution Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Question Dwell Time & Revisit Breakdown</CardTitle>
              <CardDescription>
                Sub-second monotonic active duration measured across single or multiple question visits
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <span>Quality: {timeSummary.measurementQuality}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Total Active Dwell</th>
                  <th className="py-2.5 px-3">Visits</th>
                  <th className="py-2.5 px-3">Longest Visit</th>
                  <th className="py-2.5 px-3">First Selection Timing</th>
                  <th className="py-2.5 px-3">Revisit Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeSummary.questions.map((q, idx) => (
                  <tr key={q.questionId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">Q{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {formatSec(q.totalActiveTimeMs)}s
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{q.visitCount}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatSec(q.longestVisitDurationMs)}s</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {q.timeBeforeFirstSelectionMs !== null
                        ? `${formatSec(q.timeBeforeFirstSelectionMs)}s`
                        : "No Answer"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {q.timeSpentDuringRevisitsMs > 0
                        ? `${formatSec(q.timeSpentDuringRevisitsMs)}s`
                        : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
