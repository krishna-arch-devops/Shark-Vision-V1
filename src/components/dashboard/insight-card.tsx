import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { RecommendationItem } from "@/features/analytics/types";

export interface InsightCardProps {
  item: RecommendationItem;
  className?: string;
  onActionClick?: () => void;
}

export function InsightCard({ item, className, onActionClick }: InsightCardProps) {
  const priorityConfig = {
    HIGH: {
      badge: "danger" as const,
      icon: AlertTriangle,
      border: "border-rose-100 bg-rose-50/30",
    },
    MEDIUM: {
      badge: "warning" as const,
      icon: Lightbulb,
      border: "border-amber-100 bg-amber-50/30",
    },
    LOW: {
      badge: "success" as const,
      icon: CheckCircle,
      border: "border-emerald-100 bg-emerald-50/30",
    },
  };

  const config = priorityConfig[item.priority] || priorityConfig.MEDIUM;
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "p-5 transition hover:shadow-md flex flex-col justify-between",
        config.border,
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {item.title}
            </h4>
          </div>
          <Badge variant={config.badge} className="text-[10px]">
            {item.priority} PRIORITY
          </Badge>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {item.explanation}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-800">
          Action: <span className="font-normal text-slate-600">{item.suggestedAction}</span>
        </span>
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 shrink-0 ml-2"
          >
            <span>Review</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </Card>
  );
}
