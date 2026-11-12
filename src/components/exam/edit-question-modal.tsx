"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuestionAction } from "@/lib/exam/management";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Edit3, Check, AlertCircle, Loader2 } from "lucide-react";

export interface EditQuestionModalProps {
  question: {
    id: string;
    category: string;
    subjectId: string;
    topic: string;
    difficulty: string;
    questionText: string;
    imageUrl?: string | null;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    explanation?: string | null;
    defaultMarks: number;
    defaultNegativeMarks: number;
    benchmarkSeconds?: number;
  };
  subjects: Array<{ id: string; name: string; code: string }>;
}

export function EditQuestionModal({ question, subjects }: EditQuestionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const optA = question.options?.find((o) => o.id === "A")?.text || "";
  const optB = question.options?.find((o) => o.id === "B")?.text || "";
  const optC = question.options?.find((o) => o.id === "C")?.text || "";
  const optD = question.options?.find((o) => o.id === "D")?.text || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    try {
      await updateQuestionAction(question.id, {
        category: formData.get("category") as any,
        subjectId: formData.get("subjectId") as string,
        topic: formData.get("topic") as string,
        difficulty: formData.get("difficulty") as any,
        questionText: formData.get("questionText") as string,
        imageUrl: (formData.get("imageUrl") as string) || null,
        optionA: formData.get("optionA") as string,
        optionB: formData.get("optionB") as string,
        optionC: formData.get("optionC") as string,
        optionD: formData.get("optionD") as string,
        correctAnswer: formData.get("correctAnswer") as any,
        explanation: (formData.get("explanation") as string) || null,
        defaultMarks: Number(formData.get("defaultMarks") || 4),
        defaultNegativeMarks: Number(formData.get("defaultNegativeMarks") || 1),
        benchmarkSeconds: Number(formData.get("benchmarkSeconds") || 60),
      });

      setSuccessMsg("Question updated successfully!");
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 h-8 px-2.5 rounded-lg flex items-center gap-1.5"
      >
        <Edit3 className="h-3.5 w-3.5" />
        Edit
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Edit Question</h3>
                <p className="text-xs text-slate-500">Update problem stem, answer options, or benchmark duration.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category</label>
                  <select
                    name="category"
                    defaultValue={question.category}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="JEE_MAIN">JEE Main</option>
                    <option value="JEE_ADVANCED">JEE Advanced</option>
                    <option value="NEET">NEET UG</option>
                    <option value="FOUNDATION">Foundation</option>
                    <option value="DEMO">Executive Demo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    name="subjectId"
                    defaultValue={question.subjectId}
                    required
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    name="difficulty"
                    defaultValue={question.difficulty}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Name</label>
                <Input
                  type="text"
                  name="topic"
                  defaultValue={question.topic}
                  required
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Statement</label>
                <textarea
                  name="questionText"
                  rows={3}
                  defaultValue={question.questionText}
                  required
                  className="w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="block text-xs font-semibold text-slate-800">Four Answer Options</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Option A</label>
                    <Input name="optionA" defaultValue={optA} required className="text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Option B</label>
                    <Input name="optionB" defaultValue={optB} required className="text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Option C</label>
                    <Input name="optionC" defaultValue={optC} required className="text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Option D</label>
                    <Input name="optionD" defaultValue={optD} required className="text-xs" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correct Answer</label>
                  <select
                    name="correctAnswer"
                    defaultValue={question.correctAnswer}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Benchmark (Seconds)</label>
                  <Input
                    type="number"
                    name="benchmarkSeconds"
                    defaultValue={question.benchmarkSeconds || 60}
                    min={10}
                    max={600}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marks (+ / -)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      name="defaultMarks"
                      defaultValue={question.defaultMarks}
                      min={1}
                      max={20}
                      className="text-xs"
                      title="Correct Marks"
                    />
                    <Input
                      type="number"
                      name="defaultNegativeMarks"
                      defaultValue={question.defaultNegativeMarks}
                      min={0}
                      max={10}
                      className="text-xs"
                      title="Negative Marks"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Solution / Explanation</label>
                <textarea
                  name="explanation"
                  rows={2}
                  defaultValue={question.explanation || ""}
                  className="w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
