import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: "default" | "success" | "warning" | "danger" | "teal";
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = "default",
  className,
}: MetricCardProps) {
  const iconColors = {
    default: "text-slate-600 bg-slate-100",
    success: "text-emerald-700 bg-emerald-50",
    warning: "text-amber-700 bg-amber-50",
    danger: "text-rose-700 bg-rose-50",
    teal: "text-sky-700 bg-sky-50",
  };

  return (
    <Card className={cn("p-5 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {Icon && (
          <div className={cn("p-2 rounded-lg", iconColors[color])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
