"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);

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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            Create a secure new password for your account
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
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{state.message}</span>
              </div>
              <Link
                href="/login"
                className="block text-center rounded-lg bg-sky-600 py-2.5 text-xs font-semibold text-white hover:bg-sky-700"
              >
                Proceed to Login
              </Link>
            </div>
          )}

          {!state?.success && (
            <form action={formAction} className="space-y-4">
              <Input
                name="password"
                type="password"
                label="New Password"
                placeholder="••••••••"
                required
                error={state?.errors?.password?.[0]}
              />

              <Input
                name="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                required
                error={state?.errors?.confirmPassword?.[0]}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isPending}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
