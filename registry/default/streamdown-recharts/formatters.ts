import type { RechartsChartSpec, RechartsSeries } from "./schema";

type NumberFormat = NonNullable<RechartsSeries["valueFormat"]>;

const numberFormatOptions = {
  compact: { maximumFractionDigits: 1, notation: "compact" },
  currency: { maximumFractionDigits: 0, style: "currency" },
  integer: { maximumFractionDigits: 0 },
  percent: { maximumFractionDigits: 1, style: "percent" },
  raw: { maximumFractionDigits: 2 },
} satisfies Record<NumberFormat, Intl.NumberFormatOptions>;

type FormatOptions = Pick<RechartsChartSpec, "currency" | "locale">;

export const formatNumber = (
  value: number,
  series?: RechartsSeries,
  spec?: FormatOptions,
): string => {
  const prefix = series?.valuePrefix ?? "";
  const suffix = series?.valueSuffix ?? "";
  const valueFormat = series?.valueFormat ?? "raw";
  const options = {
    ...numberFormatOptions[valueFormat],
    ...(valueFormat === "currency" ? { currency: spec?.currency ?? "USD" } : {}),
  };
  const formattedValue = new Intl.NumberFormat(
    spec?.locale ?? "en-US",
    options,
  ).format(value);

  return `${prefix}${formattedValue}${suffix}`;
};

export const formatTick = (
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
