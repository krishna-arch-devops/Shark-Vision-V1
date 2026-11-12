"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createExaminationAction } from "@/lib/exam/management";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, AlertCircle, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ExamBuilderProps {
  batches: Array<{ id: string; name: string; target_exam: string }>;
  availableQuestions: Array<{
    id: string;
    topic: string;
    difficulty: string;
    question_text: string;
    default_marks: number;
  }>;
}

export function ExamBuilderForm({ batches, availableQuestions }: ExamBuilderProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const toggleQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const toggleBatch = (bId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      setErrorMsg("Please select at least one question for the test.");
      return;
    }
    if (selectedBatchIds.length === 0) {
      setErrorMsg("Please assign the examination to at least one batch.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    try {
      await createExaminationAction({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        category: formData.get("category") as any,
        durationMinutes: Number(formData.get("durationMinutes")),
        startWindow: new Date(formData.get("startWindow") as string).toISOString(),
        endWindow: new Date(formData.get("endWindow") as string).toISOString(),
        maxAttempts: Number(formData.get("maxAttempts") || 1),
        resultReleasePolicy: formData.get("resultReleasePolicy") as any,
        questionIds: selectedQuestionIds,
        batchIds: selectedBatchIds,
        isPublished: true,
      });

      setSuccessMsg("Examination authored, assigned, and published successfully!");
      router.push("/teacher/examinations");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create examination");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create & Deploy Examination</CardTitle>
        <CardDescription>
          Configure parameters, select questions from the bank, and deploy to authorized batches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            name="title"
            label="Examination Title"
            placeholder="e.g. JEE Main Full Test 01 (Physics & Math)"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Exam
              </label>
              <select
                name="category"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                defaultValue="JEE_MAIN"
              >
                <option value="JEE_MAIN">JEE Main</option>
                <option value="JEE_ADVANCED">JEE Advanced</option>
                <option value="NEET">NEET UG</option>
                <option value="FOUNDATION">Foundation</option>
              </select>
            </div>

            <Input
              name="durationMinutes"
              type="number"
              label="Duration (Minutes)"
              defaultValue={60}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Result Release
              </label>
              <select
                name="resultReleasePolicy"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                defaultValue="AFTER_DEADLINE"
              >
                <option value="AFTER_DEADLINE">After Deadline</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="MANUAL">Manual Release</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              name="startWindow"
              type="datetime-local"
              label="Start Availability"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
            />
            <Input
              name="endWindow"
              type="datetime-local"
              label="End Availability"
              defaultValue={new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16)}
              required
            />
          </div>

          {/* Batch Assignment Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Assign to Batches ({selectedBatchIds.length} selected)
            </label>
            {batches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {batches.map((b) => {
                  const isChecked = selectedBatchIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBatch(b.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 cursor-pointer transition",
                        isChecked ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-xs font-semibold text-slate-800">{b.name}</span>
                      <Badge variant={isChecked ? "default" : "outline"}>{b.target_exam}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No batches currently assigned to you.</p>
            )}
          </div>

          {/* Question Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Select Questions ({selectedQuestionIds.length} chosen)
              </label>
            </div>

            {availableQuestions.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {availableQuestions.map((q) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={cn(
                        "flex items-start justify-between rounded-lg border p-3 cursor-pointer transition text-xs",
                        isChecked ? "border-sky-600 bg-sky-50/70" : "border-slate-100 hover:bg-slate-50"
                      )}
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{q.topic}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{q.difficulty}</span>
                        </div>
                        <p className="text-slate-600 line-clamp-1">{q.question_text}</p>
                      </div>
                      <Badge variant={isChecked ? "default" : "outline"}>+{q.default_marks} Marks</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No questions found in Question Bank. Please author questions first.
              </p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Publish and Deploy Examination
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
