import { z } from "zod";

export const ChartValueSchema = z.union([z.string(), z.number(), z.null()]);
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

export type ParseResult =
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "valid"; spec: RechartsChartSpec };

export type TableColumn = {
  key: string;
  label: string;
  series?: RechartsSeries;
};
