"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-base shadow-sm">
              SV
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SHARKVISION
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recover Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {state?.message && !state.success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {state?.success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{state.message}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="Account Email"
              placeholder="user@example.com"
              required
              error={state?.errors?.email?.[0]}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isPending}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Recovery Email
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
