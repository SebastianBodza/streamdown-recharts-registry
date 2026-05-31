"use client";

import { chartHeightClass } from "./charts";

export const ChartLoadingPlaceholder = () => (
  <div className="not-prose w-full bg-card text-card-foreground shadow-sm">
    <div className="px-4 py-3">
      <div className="h-4 w-48 animate-pulse bg-muted" />
      <div className="mt-2 h-3 w-72 max-w-full animate-pulse bg-muted/70" />
    </div>
    <div className="p-4">
      <div className={`relative ${chartHeightClass} w-full overflow-hidden bg-muted/30`}>
        <div className="absolute inset-x-6 bottom-8 top-6 flex items-end gap-4">
          {["h-2/5", "h-3/5", "h-1/2", "h-4/5", "h-2/3"].map((height) => (
            <div className={`${height} flex-1 animate-pulse bg-muted`} key={height} />
          ))}
        </div>
        <div className="absolute bottom-5 left-6 right-6 h-px bg-muted-foreground/20" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          Creating chart...
        </div>
      </div>
    </div>
  </div>
);
