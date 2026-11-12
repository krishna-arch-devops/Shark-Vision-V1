"use client";

import React, { useState } from "react";
import { updateExamSettingsAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Check, Loader2 } from "lucide-react";

interface ExamSettingsDialogProps {
  exam: {
    id: string;
    title: string;
    maxAttempts: number;
    durationMinutes: number;
    isPublished: boolean;
    resultReleasePolicy: string;
  };
}

export function ExamSettingsModal({ exam }: ExamSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.append("examId", exam.id);

    try {
      await updateExamSettingsAction(formData);
      setMessage("Settings updated successfully!");
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200"
      >
        <Settings className="h-3.5 w-3.5" />
        Configure
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Exam Parameters & Policy</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{exam.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Attempts per Student
                </label>
                <Input
                  type="number"
                  name="maxAttempts"
                  defaultValue={exam.maxAttempts}
                  min={1}
                  max={50}
                  required
                  className="w-full text-xs"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Allow students to take this test multiple times (e.g. for revision or practice).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <Input
                  type="number"
                  name="durationMinutes"
                  defaultValue={exam.durationMinutes}
                  min={5}
                  max={360}
                  required
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Result Release Policy
                </label>
                <select
                  name="resultReleasePolicy"
                  defaultValue={exam.resultReleasePolicy}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="IMMEDIATE">IMMEDIATE (Instantly after submit)</option>
                  <option value="AFTER_DEADLINE">AFTER_DEADLINE (After window ends)</option>
                  <option value="MANUAL">MANUAL (Admin trigger only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Publication Status
                </label>
                <select
                  name="isPublished"
                  defaultValue={exam.isPublished ? "true" : "false"}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="true">Published (Visible to Enrolled Students)</option>
                  <option value="false">Draft (Hidden from Students)</option>
                </select>
              </div>

              {message && (
                <div
                  className={`rounded-md p-2 text-xs font-medium ${
                    message.startsWith("Error")
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5"
                  }`}
                >
                  {!message.startsWith("Error") && <Check className="h-3.5 w-3.5" />}
                  {message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
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
