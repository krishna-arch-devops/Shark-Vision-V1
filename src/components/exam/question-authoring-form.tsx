"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuestionAction } from "@/lib/exam/management";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Check, AlertCircle } from "lucide-react";

export interface QuestionFormProps {
  subjects: Array<{ id: string; name: string; code: string }>;
}

export function QuestionAuthoringForm({ subjects }: QuestionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    try {
      await createQuestionAction({
        category: formData.get("category") as any,
        subjectId: formData.get("subjectId") as string,
        topic: formData.get("topic") as string,
        difficulty: formData.get("difficulty") as any,
        questionText: formData.get("questionText") as string,
        imageUrl: (formData.get("imageUrl") as string) || undefined,
        optionA: formData.get("optionA") as string,
        optionB: formData.get("optionB") as string,
        optionC: formData.get("optionC") as string,
        optionD: formData.get("optionD") as string,
        correctAnswer: formData.get("correctAnswer") as any,
        explanation: (formData.get("explanation") as string) || undefined,
        defaultMarks: Number(formData.get("defaultMarks") || 4),
        defaultNegativeMarks: Number(formData.get("defaultNegativeMarks") || 1),
        isPublished: true,
      });

      setSuccessMsg("Question created and published to Question Bank successfully!");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Author New Question</CardTitle>
        <CardDescription>
          Add single-correct MCQ questions with difficulty parameters and complete solutions.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Exam Stream
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Subject
              </label>
              <select
                name="subjectId"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Difficulty
              </label>
              <select
                name="difficulty"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                defaultValue="MEDIUM"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <Input
            name="topic"
            label="Chapter / Topic"
            placeholder="e.g. Rotational Dynamics, Thermodynamics"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Question Statement
            </label>
            <textarea
              name="questionText"
              rows={4}
              required
              placeholder="State the problem clearly..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <Input
            name="imageUrl"
            label="Optional Diagram URL"
            placeholder="https://..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="optionA" label="Option (A)" placeholder="Text for option A" required />
            <Input name="optionB" label="Option (B)" placeholder="Text for option B" required />
            <Input name="optionC" label="Option (C)" placeholder="Text for option C" required />
            <Input name="optionD" label="Option (D)" placeholder="Text for option D" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Correct Answer
              </label>
              <select
                name="correctAnswer"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-sky-700"
                defaultValue="A"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>

            <Input
              name="defaultMarks"
              type="number"
              label="Marks"
              defaultValue={4}
              required
            />
            <Input
              name="defaultNegativeMarks"
              type="number"
              label="Negative Marks"
              defaultValue={1}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Detailed Solution / Explanation
            </label>
            <textarea
              name="explanation"
              rows={3}
              placeholder="Provide solution steps for post-exam review..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" />
            Publish Question to Central Bank
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
