"use client";

import { toPng } from "html-to-image";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CustomRenderer, CustomRendererProps } from "streamdown";
import { CodeBlock, CodeBlockContainer, CodeBlockHeader } from "streamdown";
import { z } from "zod";
import { DownloadIcon, MoreHorizontalIcon, Table2Icon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1) / 0.7)",
  "hsl(var(--chart-2) / 0.7)",
  "hsl(var(--chart-3) / 0.7)",
];

const chartHeightClass = "h-[420px]";
const chartMaxHeightClass = "max-h-[420px]";

export const ChartValueSchema = z.union([z.string(), z.number()]);
export const ChartDataRowSchema = z.record(z.string(), ChartValueSchema);

export const ChartSeriesSchema = z.object({
  dataKey: z.string().min(1),
  label: z.string().min(1).optional(),
  valueFormat: z
    .enum(["integer", "compact", "raw", "currency", "percent"])
    .optional(),
  valuePrefix: z.string().optional(),
  valueSuffix: z.string().optional(),
});

export const RechartsChartSpecSchema = z.object({
  chartType: z.enum(["bar", "line", "area", "pie", "scatter"]),
  layout: z.enum(["horizontal", "vertical"]).optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  xKey: z.string().min(1).optional(),
  nameKey: z.string().min(1).optional(),
  valueKey: z.string().min(1).optional(),
  series: z.array(ChartSeriesSchema).min(1),
  data: z.array(ChartDataRowSchema).min(1),
});

export type RechartsChartSpec = z.infer<typeof RechartsChartSpecSchema>;
export type RechartsSeries = z.infer<typeof ChartSeriesSchema>;
export type ChartDataRow = z.infer<typeof ChartDataRowSchema>;
export type ChartView = "chart" | "table";

type ParseResult =
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "valid"; spec: RechartsChartSpec };

type TableColumn = {
  key: string;
  label: string;
  series?: RechartsSeries;
};

const getSeriesColor = (index: number): string =>
  chartColors[index % chartColors.length];

const getSeriesName = (series: RechartsSeries): string =>
  series.label ?? series.dataKey;

const numberFormatOptions = {
  compact: { maximumFractionDigits: 1, notation: "compact" },
  currency: { maximumFractionDigits: 0, style: "currency" },
  integer: { maximumFractionDigits: 0 },
  percent: { maximumFractionDigits: 1, style: "percent" },
  raw: { maximumFractionDigits: 2 },
} satisfies Record<
  NonNullable<RechartsSeries["valueFormat"]>,
  Intl.NumberFormatOptions
>;

const formatNumber = (
  value: number,
  series?: RechartsSeries,
  spec?: Pick<RechartsChartSpec, "currency" | "locale">,
): string => {
  const prefix = series?.valuePrefix ?? "";
  const suffix = series?.valueSuffix ?? "";
  const valueFormat = series?.valueFormat ?? "raw";
  const options = {
    ...numberFormatOptions[valueFormat],
    ...(valueFormat === "currency" ? { currency: spec?.currency ?? "USD" } : {}),
  };
  const formattedValue = new Intl.NumberFormat(spec?.locale ?? "en-US", options).format(value);

  return `${prefix}${formattedValue}${suffix}`;
};

const formatTick = (
  value: number | string,
  spec?: Pick<RechartsChartSpec, "locale">,
): string => {
  if (typeof value !== "number") {
    return value;
  }

  return new Intl.NumberFormat(spec?.locale ?? "en-US", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
};

const isLikelyIncompleteJson = (code: string): boolean => {
  const trimmedCode = code.trim();

  return trimmedCode === "" || !/[}\]]$/.test(trimmedCode);
};

export const parseChartSpec = (code: string, isIncomplete?: boolean): ParseResult => {
  if (isIncomplete) {
    return { status: "loading" };
  }

  try {
    const parsedJson: unknown = JSON.parse(code);
    const parseResult = RechartsChartSpecSchema.safeParse(parsedJson);

    if (!parseResult.success) {
      return {
        status: "invalid",
        message:
          parseResult.error.issues[0]?.message ??
          "Invalid Recharts JSON structure.",
      };
    }

    return { status: "valid", spec: parseResult.data };
  } catch {
    if (isLikelyIncompleteJson(code)) {
      return { status: "loading" };
    }

    return {
      status: "invalid",
      message: "Could not parse the Recharts JSON.",
    };
  }
};

const getTableColumns = (spec: RechartsChartSpec): TableColumn[] => {
  if (spec.chartType === "pie") {
    const nameKey = spec.nameKey ?? spec.xKey ?? "name";
    const valueKey = spec.valueKey ?? spec.series[0].dataKey;

    return [
      { key: nameKey, label: nameKey },
      {
        key: valueKey,
        label: spec.series[0].label ?? valueKey,
        series: spec.series[0],
      },
    ];
  }

  const xKey = spec.xKey ?? spec.nameKey ?? "name";

  return [
    { key: xKey, label: xKey },
    ...spec.series.map((series) => ({
      key: series.dataKey,
      label: series.label ?? series.dataKey,
      series,
    })),
  ];
};

const formatTableValue = (
  value: string | number | undefined,
  series: RechartsSeries | undefined,
  spec: RechartsChartSpec,
): string => {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "number" && series) {
    return formatNumber(value, series, spec);
  }

  return String(value);
};

const getTableExportRows = (spec: RechartsChartSpec): Array<Record<string, string>> => {
  const columns = getTableColumns(spec);

  return spec.data.map((row) => {
    const exportRow: Record<string, string> = {};

    for (const column of columns) {
      exportRow[column.label] = formatTableValue(row[column.key], column.series, spec);
    }

    return exportRow;
  });
};

const sanitizeFileName = (fileName: string): string =>
  fileName.trim().replace(/[<>:"/\\|?*]+/g, "-") || "chart";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadTableAsCsv = (spec: RechartsChartSpec) => {
  const columns = getTableColumns(spec);
  const rows = getTableExportRows(spec);
  const header = columns.map((column) => column.label);
  const csvContent = [header, ...rows.map((row) => header.map((key) => row[key]))]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\ufeff${csvContent}`], {
    type: "text/csv;charset=utf-8",
  });

  downloadBlob(blob, `${sanitizeFileName(spec.meta?.title ?? "chart")}.csv`);
};

const downloadTableAsXlsx = async (spec: RechartsChartSpec) => {
  const xlsx = await import("@e965/xlsx");
  const fileName = sanitizeFileName(spec.meta?.title ?? "chart");
  const worksheet = xlsx.utils.json_to_sheet(getTableExportRows(spec));
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  xlsx.writeFile(workbook, `${fileName}.xlsx`);
};

const downloadChartAsPng = async (element: HTMLElement, fileName: string) => {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    filter: (node: HTMLElement) =>
      node.getAttribute?.("data-export-exclude") !== "true",
  });
  const link = document.createElement("a");

  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

const renderBars = (spec: RechartsChartSpec) =>
  spec.series.map((series, index) => (
    <Bar
      dataKey={series.dataKey}
      fill={getSeriesColor(index)}
      key={series.dataKey}
      name={getSeriesName(series)}
      radius={0}
    />
  ));

const renderLines = (spec: RechartsChartSpec) =>
  spec.series.map((series, index) => (
    <Line
      dataKey={series.dataKey}
      dot={{ r: 3 }}
      key={series.dataKey}
      name={getSeriesName(series)}
      stroke={getSeriesColor(index)}
      strokeWidth={2}
      type="monotone"
    />
  ));

const renderAreas = (spec: RechartsChartSpec) =>
  spec.series.map((series, index) => (
    <Area
      dataKey={series.dataKey}
      fill={getSeriesColor(index)}
      fillOpacity={0.18}
      key={series.dataKey}
      name={getSeriesName(series)}
      stroke={getSeriesColor(index)}
      strokeWidth={2}
      type="monotone"
    />
  ));

const ChartFrame = ({ children }: { children: ReactElement }) => (
  <div className={`${chartHeightClass} w-full`}>
    <ResponsiveContainer height="100%" width="100%">
      {children}
    </ResponsiveContainer>
  </div>
);

const CartesianChart = ({ spec }: { spec: RechartsChartSpec }) => {
  const chartMargin = { top: 8, right: 20, bottom: 8, left: 8 };
  const xKey = spec.xKey ?? spec.nameKey ?? "name";
  const firstSeries = spec.series[0];
  const vertical = spec.chartType === "bar" && spec.layout === "vertical";

  if (vertical) {
    return (
      <ChartFrame>
        <BarChart data={spec.data} layout="vertical" margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            tickFormatter={(value: number) => formatNumber(value, firstSeries, spec)}
            type="number"
          />
          <YAxis dataKey={xKey} type="category" width={110} />
          <Tooltip />
          <Legend />
          {renderBars(spec)}
        </BarChart>
      </ChartFrame>
    );
  }

  if (spec.chartType === "bar") {
    return (
      <ChartFrame>
        <BarChart data={spec.data} layout="horizontal" margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} />
          <YAxis tickFormatter={(value: number | string) => formatTick(value, spec)} />
          <Tooltip />
          <Legend />
          {renderBars(spec)}
        </BarChart>
      </ChartFrame>
    );
  }

  if (spec.chartType === "area") {
    return (
      <ChartFrame>
        <AreaChart data={spec.data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} />
          <YAxis tickFormatter={(value: number | string) => formatTick(value, spec)} />
          <Tooltip />
          <Legend />
          {renderAreas(spec)}
        </AreaChart>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame>
      <LineChart data={spec.data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} />
        <YAxis tickFormatter={(value: number | string) => formatTick(value, spec)} />
        <Tooltip />
        <Legend />
        {renderLines(spec)}
      </LineChart>
    </ChartFrame>
  );
};

const PieVisualization = ({ spec }: { spec: RechartsChartSpec }) => {
  const nameKey = spec.nameKey ?? spec.xKey ?? "name";
  const valueKey = spec.valueKey ?? spec.series[0].dataKey;

  return (
    <ChartFrame>
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie
          cx="50%"
          cy="50%"
          data={spec.data}
          dataKey={valueKey}
          innerRadius={48}
          label
          nameKey={nameKey}
          outerRadius={105}
          paddingAngle={2}
        >
          {spec.data.map((row, index) => (
            <Cell fill={getSeriesColor(index)} key={`${row[nameKey]}-${index}`} />
          ))}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
};

const ScatterVisualization = ({ spec }: { spec: RechartsChartSpec }) => {
  const xKey = spec.xKey ?? "x";
  const series = spec.series[0];

  return (
    <ChartFrame>
      <ScatterChart margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          name={xKey}
          tickFormatter={(value: number | string) => formatTick(value, spec)}
          type="number"
        />
        <YAxis
          dataKey={series.dataKey}
          name={getSeriesName(series)}
          tickFormatter={(value: number) => formatNumber(value, series, spec)}
          type="number"
        />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        <Scatter data={spec.data} fill={getSeriesColor(0)} name={getSeriesName(series)} />
      </ScatterChart>
    </ChartFrame>
  );
};

const ChartDataTable = ({ spec }: { spec: RechartsChartSpec }) => {
  const columns = getTableColumns(spec);

  return (
    <div className={`${chartMaxHeightClass} overflow-auto bg-muted/20`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th className="px-3 py-2 font-medium" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.data.map((row, rowIndex) => (
            <tr className="odd:bg-background/50" key={rowIndex}>
              {columns.map((column) => (
                <td className="px-3 py-2" key={column.key}>
                  {formatTableValue(row[column.key], column.series, spec)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChartLoadingPlaceholder = () => (
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

const ChartShell = ({
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

export const rechartsRenderers = [
  {
    language: ["recharts-json", "rechart-json"],
    component: RechartsJsonRenderer,
  },
] satisfies CustomRenderer[];
