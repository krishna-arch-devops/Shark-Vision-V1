"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Profile } from "@/types/database";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface DashboardLayoutProps {
  profile: Profile;
  navItems: NavItem[];
  roleTitle: string;
  roleBadgeColor?: "default" | "success" | "warning" | "danger";
  children: React.ReactNode;
}

export function DashboardLayout({
  profile,
  navItems,
  roleTitle,
  children,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-black text-sm shadow-sm">
              SV
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                SHARKVISION
              </span>
              <span className="text-[10px] font-semibold text-sky-600 tracking-wider uppercase mt-0.5">
                {roleTitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && item.href !== "/teacher" && item.href !== "/parent" && item.href !== "/student" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sky-50 text-sky-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", isActive ? "text-sky-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200">
              {profile.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-800">{profile.full_name}</p>
              <p className="truncate text-[10px] text-slate-400">{profile.email}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="font-bold text-slate-900 text-sm">SHARKVISION</span>
          </div>

          {/* Breadcrumbs / Page Context */}
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <span>Portal</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-900">{roleTitle}</span>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Role: {profile.role}</span>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition"
              title="Profile Settings"
            >
              <UserIcon className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-slate-100">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </form>
              </div>
            </nav>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
