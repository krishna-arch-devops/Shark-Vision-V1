import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="max-w-sm text-xs text-slate-500 mb-4">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
