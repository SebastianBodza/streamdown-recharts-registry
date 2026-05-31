"use client";

import { Streamdown } from "streamdown";
import { rechartsRenderers } from "@/components/streamdown-recharts";

const markdown = `Here is a streamed chart shape:

\`\`\`recharts-json
{
  "chartType": "bar",
  "currency": "USD",
  "meta": {
    "title": "Quarterly revenue",
    "description": "Example data rendered from a Streamdown code fence"
  },
  "xKey": "quarter",
  "series": [
    { "dataKey": "revenue", "label": "Revenue", "valueFormat": "currency" }
  ],
  "data": [
    { "quarter": "Q1", "revenue": 1200000 },
    { "quarter": "Q2", "revenue": 1500000 },
    { "quarter": "Q3", "revenue": 1350000 },
    { "quarter": "Q4", "revenue": 1800000 }
  ]
}
\`\`\``;

export default function StreamdownRechartsDemo() {
  return (
    <Streamdown plugins={{ renderers: rechartsRenderers }}>
      {markdown}
    </Streamdown>
  );
}
