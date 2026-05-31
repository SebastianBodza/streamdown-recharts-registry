"use client";

import type { ReactElement } from "react";
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
import { formatNumber, formatTick } from "./formatters";
import type { RechartsChartSpec, RechartsSeries } from "./schema";

export const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1) / 0.7)",
  "hsl(var(--chart-2) / 0.7)",
  "hsl(var(--chart-3) / 0.7)",
];

export const chartHeightClass = "h-[420px]";
export const chartMaxHeightClass = "max-h-[420px]";

const getSeriesColor = (index: number): string =>
  chartColors[index % chartColors.length];

const getSeriesName = (series: RechartsSeries): string =>
  series.label ?? series.dataKey;

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

export const CartesianChart = ({ spec }: { spec: RechartsChartSpec }) => {
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

export const PieVisualization = ({ spec }: { spec: RechartsChartSpec }) => {
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

export const ScatterVisualization = ({ spec }: { spec: RechartsChartSpec }) => {
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
