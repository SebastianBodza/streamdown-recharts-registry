"use client";

import { DownloadIcon, MoreHorizontalIcon, Table2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChartView, RechartsChartSpec } from "./schema";

type ChartShellProps = {
  spec: RechartsChartSpec;
  children: ReactNode;
  shellRef: React.RefObject<HTMLDivElement | null>;
  view: ChartView;
  onDownloadCsv: () => void;
  onDownloadImage: () => void;
  onDownloadXlsx: () => void;
  onToggleView: () => void;
};

export const ChartShell = ({
  spec,
  children,
  shellRef,
  view,
  onDownloadCsv,
  onDownloadImage,
  onDownloadXlsx,
  onToggleView,
}: ChartShellProps) => (
  <div className="not-prose w-full bg-card text-card-foreground shadow-sm" ref={shellRef}>
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="font-semibold leading-none">
          {spec.meta?.title ?? "Visualization"}
        </div>
        {spec.meta?.description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {spec.meta.description}
          </p>
        ) : null}
      </div>
      <div data-export-exclude="true">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Chart options"
              className="h-8 w-8 shrink-0 rounded-none"
              size="icon"
              type="button"
              variant="ghost"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-0">
            <DropdownMenuItem onClick={onToggleView}>
              <Table2Icon className="size-4" />
              {view === "chart" ? "Show as table" : "Show as chart"}
            </DropdownMenuItem>
            {view === "chart" ? (
              <DropdownMenuItem onClick={onDownloadImage}>
                <DownloadIcon className="size-4" />
                Download image
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={onDownloadCsv}>
                  <DownloadIcon className="size-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownloadXlsx}>
                  <DownloadIcon className="size-4" />
                  Download XLSX
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);
