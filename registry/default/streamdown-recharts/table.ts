import { formatNumber } from "./formatters";
import type { RechartsChartSpec, RechartsSeries, TableColumn } from "./schema";

export const getTableColumns = (spec: RechartsChartSpec): TableColumn[] => {
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

export const formatTableValue = (
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

export const getTableExportRows = (
  spec: RechartsChartSpec,
): Array<Record<string, string>> => {
  const columns = getTableColumns(spec);

  return spec.data.map((row) => {
    const exportRow: Record<string, string> = {};

    for (const column of columns) {
      exportRow[column.label] = formatTableValue(row[column.key], column.series, spec);
    }

    return exportRow;
  });
};
