"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your portal</h2>
          <p className="mt-1 text-xs text-slate-500">
            JEE & NEET Performance Intelligence Platform
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {state?.message && !state.success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="Email Address"
              placeholder="student@example.com"
              required
              error={state?.errors?.email?.[0]}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                error={state?.errors?.password?.[0]}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isPending}
            >
              <Lock className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              New student?{" "}
              <Link href="/register" className="font-semibold text-sky-600 hover:text-sky-700">
                Create student account
              </Link>
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Teachers & Admin: Accounts are provisioned by institution management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
