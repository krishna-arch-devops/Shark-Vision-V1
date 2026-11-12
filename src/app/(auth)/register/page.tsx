"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerStudentAction } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerStudentAction, null);

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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Registration</h2>
          <p className="mt-1 text-xs text-slate-500">
            Self-registration creates student accounts for JEE & NEET practice
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
              name="fullName"
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              required
              error={state?.errors?.fullName?.[0]}
            />

            <Input
              name="email"
              type="email"
              label="Email Address"
              placeholder="rahul@example.com"
              required
              error={state?.errors?.email?.[0]}
            />

            <Input
              name="phoneNumber"
              type="tel"
              label="Phone Number (10 digits)"
              placeholder="9876543210"
              error={state?.errors?.phoneNumber?.[0]}
            />

            <div className="w-full space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Target Examination
              </label>
              <select
                name="targetExam"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                defaultValue="JEE_MAIN"
              >
                <option value="JEE_MAIN">JEE Main</option>
                <option value="JEE_ADVANCED">JEE Advanced</option>
                <option value="NEET">NEET UG</option>
                <option value="FOUNDATION">Foundation (9th / 10th)</option>
              </select>
            </div>

            <Input
              name="password"
              type="password"
              label="Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)"
              placeholder="••••••••"
              required
              error={state?.errors?.password?.[0]}
            />

            <Input
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              required
              error={state?.errors?.confirmPassword?.[0]}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Student Account
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-sky-600 hover:text-sky-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
