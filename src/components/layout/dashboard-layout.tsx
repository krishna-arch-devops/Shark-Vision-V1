"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  FileSpreadsheet,
  Zap,
  BarChart3,
  Clock,
  Shuffle,
  TrendingUp,
  BookmarkCheck,
  User,
  Users,
  Building2,
  FileQuestion,
  CreditCard,
  Settings,
  HelpCircle,
  Award,
  BookOpen,
} from "lucide-react";
import { Profile } from "@/types/database";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  label: string;
  href: string;
  iconName?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface DashboardLayoutProps {
  profile: Profile;
  navItems: NavItem[];
  roleTitle: string;
  roleBadgeColor?: "default" | "success" | "warning" | "danger";
  children: React.ReactNode;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileSpreadsheet,
  Zap,
  BarChart3,
  Clock,
  Shuffle,
  TrendingUp,
  BookmarkCheck,
  User,
  Users,
  Building2,
  FileQuestion,
  CreditCard,
  Settings,
  HelpCircle,
  Award,
  BookOpen,
};

function renderItemIcon(item: NavItem, className: string) {
  if (item.iconName && ICON_MAP[item.iconName]) {
    const Component = ICON_MAP[item.iconName];
    return <Component className={className} />;
  }
  if (typeof item.icon === "function" || (item.icon && typeof item.icon === "object")) {
    const Component = item.icon;
    return <Component className={className} />;
  }
  return <LayoutDashboard className={className} />;
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
            <div>
              <span className="font-bold tracking-tight text-slate-900 text-sm">SHARKVISION</span>
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                Performance Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
                  {renderItemIcon(item, cn("h-4 w-4", isActive ? "text-sky-600" : "text-slate-400"))}
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
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
              <span>{roleTitle}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
              <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-900">Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-4 flex-1 space-y-1 px-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-sky-50 text-sky-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {renderItemIcon(item, cn("h-4 w-4", isActive ? "text-sky-600" : "text-slate-400"))}
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
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
