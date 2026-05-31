"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { CustomRendererProps } from "streamdown";
import { CodeBlock, CodeBlockContainer, CodeBlockHeader } from "streamdown";
import { CartesianChart, PieVisualization, ScatterVisualization } from "./charts";
import { ChartShell } from "./chart-shell";
import { ChartDataTable } from "./chart-table";
import {
  downloadChartAsPng,
  downloadTableAsCsv,
  downloadTableAsXlsx,
  sanitizeFileName,
} from "./downloads";
import { ChartLoadingPlaceholder } from "./loading-placeholder";
import { parseChartSpec } from "./parser";
import type { ChartView, RechartsChartSpec } from "./schema";

export {
  ChartDataRowSchema,
  ChartSeriesSchema,
  ChartValueSchema,
  RechartsChartSpecSchema,
} from "./schema";
export { parseChartSpec } from "./parser";
export type {
  ChartDataRow,
  ChartView,
  RechartsChartSpec,
  RechartsSeries,
} from "./schema";

const ChartBody = ({ spec, view }: { spec: RechartsChartSpec; view: ChartView }) => {
  if (view === "table") {
    return <ChartDataTable spec={spec} />;
  }

  if (spec.chartType === "pie") {
    return <PieVisualization spec={spec} />;
  }

  if (spec.chartType === "scatter") {
    return <ScatterVisualization spec={spec} />;
  }

  return <CartesianChart spec={spec} />;
};

const ChartVisualization = ({ spec }: { spec: RechartsChartSpec }) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ChartView>("chart");

  const handleToggleView = useCallback(() => {
    setView((currentView) => (currentView === "chart" ? "table" : "chart"));
  }, []);

  const handleDownloadImage = useCallback(() => {
    const element = shellRef.current;

    if (!element) {
      return;
    }

    void downloadChartAsPng(
      element,
      `${sanitizeFileName(spec.meta?.title ?? "chart")}.png`,
    );
  }, [spec]);

  const handleDownloadCsv = useCallback(() => {
    downloadTableAsCsv(spec);
  }, [spec]);

  const handleDownloadXlsx = useCallback(() => {
    void downloadTableAsXlsx(spec);
  }, [spec]);

  return (
    <ChartShell
      shellRef={shellRef}
      onDownloadCsv={handleDownloadCsv}
      onDownloadImage={handleDownloadImage}
      onDownloadXlsx={handleDownloadXlsx}
      onToggleView={handleToggleView}
      spec={spec}
      view={view}
    >
      <ChartBody spec={spec} view={view} />
    </ChartShell>
  );
};

export const RechartsJsonRenderer = ({
  code,
  language,
  isIncomplete,
}: CustomRendererProps) => {
  const parseResult = useMemo(
    () => parseChartSpec(code, isIncomplete),
    [code, isIncomplete],
  );

  if (parseResult.status === "loading") {
    return <ChartLoadingPlaceholder />;
  }

  if (parseResult.status === "invalid") {
    return (
      <CodeBlockContainer isIncomplete={false} language={language}>
        <CodeBlockHeader language={language} />
        <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {parseResult.message}
        </div>
        <CodeBlock code={code} isIncomplete={false} language={language} />
      </CodeBlockContainer>
    );
  }

  return <ChartVisualization spec={parseResult.spec} />;
};
