"use client";

import React, { useState } from "react";
import { resetStudentAttemptAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, Loader2, Users } from "lucide-react";

interface AttemptRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
}

interface AttemptManagerModalProps {
  examId: string;
  examTitle: string;
  attempts: AttemptRecord[];
}

export function AttemptManagerModal({ examId, examTitle, attempts }: AttemptManagerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAttemptId, setLoadingAttemptId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleAction = async (attemptId: string, actionType: "DELETE_ATTEMPT" | "RESET_TO_IN_PROGRESS") => {
    if (!confirm(actionType === "DELETE_ATTEMPT" 
      ? "Are you sure you want to delete this attempt record? This will completely clear the attempt count for this student so they can take the test again fresh."
      : "Re-open this attempt for the student?")) {
      return;
    }

    setLoadingAttemptId(attemptId);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append("attemptId", attemptId);
    formData.append("actionType", actionType);

    try {
      await resetStudentAttemptAction(formData);
      setStatusMsg("Attempt successfully updated/cleared.");
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoadingAttemptId(null);
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
        <Users className="h-3.5 w-3.5" />
        Student Attempts ({attempts.length})
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Student Attempts & Retake Access</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{examTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {statusMsg && (
              <div className="my-2 rounded-md bg-emerald-50 border border-emerald-200 p-2 text-xs font-medium text-emerald-700">
                {statusMsg}
              </div>
            )}

            <div className="mt-4 flex-1 overflow-y-auto">
              {attempts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No students have attempted this examination yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                  {attempts.map((att) => (
                    <div key={att.id} className="p-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{att.studentName}</div>
                        <div className="text-[11px] text-slate-500">{att.studentEmail}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={att.status === "SUBMITTED" ? "default" : "outline"} className="text-[10px] uppercase font-mono">
                            {att.status}
                          </Badge>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(att.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(att.id, "DELETE_ATTEMPT")}
                          disabled={loadingAttemptId === att.id}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-8 px-2"
                          title="Clear this attempt so student can retake"
                        >
                          {loadingAttemptId === att.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Reset & Allow Retake
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
