import { toPng } from "html-to-image";
import { getTableColumns, getTableExportRows } from "./table";
import type { RechartsChartSpec } from "./schema";

export const sanitizeFileName = (fileName: string): string =>
  fileName.trim().replace(/[<>:"/\\|?*]+/g, "-") || "chart";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadTableAsCsv = (spec: RechartsChartSpec) => {
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

export const downloadTableAsXlsx = async (spec: RechartsChartSpec) => {
  const xlsx = await import("@e965/xlsx");
  const fileName = sanitizeFileName(spec.meta?.title ?? "chart");
  const worksheet = xlsx.utils.json_to_sheet(getTableExportRows(spec));
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  xlsx.writeFile(workbook, `${fileName}.xlsx`);
};

export const downloadChartAsPng = async (element: HTMLElement, fileName: string) => {
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
