"use client";

import type { CustomRenderer } from "streamdown";
import { RechartsJsonRenderer } from "./renderer";

export {
  RechartsJsonRenderer,
  RechartsChartSpecSchema,
  ChartDataRowSchema,
  ChartSeriesSchema,
  ChartValueSchema,
  parseChartSpec,
} from "./renderer";
export type {
  ChartDataRow,
  ChartView,
  RechartsChartSpec,
  RechartsSeries,
} from "./renderer";

export const rechartsRenderers = [
  {
    language: ["recharts-json", "rechart-json"],
    component: RechartsJsonRenderer,
  },
] satisfies CustomRenderer[];
