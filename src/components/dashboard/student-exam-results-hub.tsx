"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CompleteAttemptAnalytics } from "@/features/analytics/types";
import { MetricCard } from "@/components/dashboard/metric-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { SpeedAccuracyMatrixView } from "@/components/dashboard/speed-accuracy-matrix-view";
import { AnswerChangeDashboardView } from "@/components/dashboard/answer-change-dashboard-view";
import { TimeIntelligenceDashboardView } from "@/components/dashboard/time-intelligence-dashboard-view";
import { SubjectsTopicsDashboardView } from "@/components/dashboard/subjects-topics-dashboard-view";
import { QuestionExplorerView } from "@/components/dashboard/question-explorer-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Target,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Shuffle,
  Layers,
  Search,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StudentExamResultsHubProps {
  analytics: CompleteAttemptAnalytics;
  examTitle: string;
  examCategory: string;
}

export function StudentExamResultsHub({
  analytics,
  examTitle,
  examCategory,
}: StudentExamResultsHubProps) {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "TIME" | "DECISIONS" | "SUBJECTS" | "EXPLORER"
  >("OVERVIEW");

  const perf = analytics.performanceOverview;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/examinations"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Examinations
        </Link>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
          {examCategory} Examination Intelligence
        </span>
      </div>

      {/* Hero Performance Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Authoritative Performance Report
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {examTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Here is how you performed across question timing, accuracy, and option revisions.
            </p>
          </div>

          <div className="flex items-center gap-6 sm:border-l sm:border-slate-100 sm:pl-8">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Score</span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900">
                {perf.marksObtained}{" "}
                <span className="text-base font-normal text-slate-400">/ {perf.maximumMarks}</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Accuracy</span>
              <div className="text-3xl sm:text-4xl font-black text-sky-600">
                {perf.accuracyPercentage !== null ? `${perf.accuracyPercentage}%` : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <MetricCard
            label="Attempted"
            value={`${perf.attemptedQuestions} / ${perf.totalQuestions}`}
            subtitle={`${perf.unansweredQuestions} questions skipped`}
            icon={Target}
            color="default"
          />
          <MetricCard
            label="Correct Answers"
            value={perf.correctAnswers}
            subtitle={`${perf.incorrectAnswers} incorrect (-${perf.incorrectAnswers} pts)`}
            icon={CheckCircle2}
            color="success"
          />
          <MetricCard
            label="Active Dwell Time"
            value={`${Math.round(perf.totalRecordedQuestionTimeMs / 60000)}m`}
            subtitle={`Wall exam: ${Math.round(perf.actualActiveExamTimeMs / 60000)}m`}
            icon={Clock}
            color="teal"
          />
          <MetricCard
            label="Avg Time / Question"
            value={`${Math.round(perf.averageActiveTimePerAttemptedMs / 1000)}s`}
            subtitle={`Median: ${Math.round(perf.medianQuestionTimeMs / 1000)}s`}
            icon={Award}
            color="warning"
          />
        </div>
      </div>

      {/* Top 3 Prioritized Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div>
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Your Top Actionable Insights</h2>
            <p className="text-xs text-slate-500">
              Deterministic, evidence-based recommendations derived from your examination telemetry.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.recommendations.map((rec) => (
              <InsightCard key={rec.ruleId} item={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto text-sm font-semibold">
          {[
            { id: "OVERVIEW", label: "Overview", icon: LayoutDashboard },
            { id: "TIME", label: "Time Intelligence", icon: Clock },
            { id: "DECISIONS", label: "Answer Changes", icon: Shuffle },
            { id: "SUBJECTS", label: "Subjects & Topics", icon: Layers },
            { id: "EXPLORER", label: "Question Explorer", icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 border-b-2 transition whitespace-nowrap",
                  isActive
                    ? "border-sky-600 text-sky-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content Panes */}
      <div>
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <SpeedAccuracyMatrixView matrix={analytics.speedAccuracyMatrix} />
            <SubjectsTopicsDashboardView
              subjects={analytics.subjectAnalytics}
              topics={analytics.topicAnalytics}
            />
          </div>
        )}

        {activeTab === "TIME" && (
          <TimeIntelligenceDashboardView
            timeSummary={analytics.timeIntelligence}
            performance={analytics.performanceOverview}
          />
        )}

        {activeTab === "DECISIONS" && (
          <AnswerChangeDashboardView summary={analytics.answerChangeIntelligence} />
        )}

        {activeTab === "SUBJECTS" && (
          <SubjectsTopicsDashboardView
            subjects={analytics.subjectAnalytics}
            topics={analytics.topicAnalytics}
          />
        )}

        {activeTab === "EXPLORER" && <QuestionExplorerView analytics={analytics} />}
      </div>
    </div>
  );
}
