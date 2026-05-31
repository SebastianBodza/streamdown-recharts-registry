"use client";

import { chartMaxHeightClass } from "./charts";
import { formatTableValue, getTableColumns } from "./table";
import type { RechartsChartSpec } from "./schema";

export const ChartDataTable = ({ spec }: { spec: RechartsChartSpec }) => {
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
