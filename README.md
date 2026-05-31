# Streamdown Recharts Registry

A small shadcn registry for a Streamdown custom renderer that turns fenced
`recharts-json` blocks into Recharts visualizations.

## Install

```bash
npx shadcn@latest add https://raw.githubusercontent.com/SebastianBodza/streamdown-recharts-registry/refs/heads/main/registry/streamdown-recharts.json
```

This installs a flat component at:

```text
components/streamdown-recharts.tsx
```

The registry item also asks shadcn to install the required `button` and
`dropdown-menu` primitives.

## Usage

```tsx
import { Streamdown } from "streamdown";
import { rechartsRenderers } from "@/components/streamdown-recharts";

export function Message({ content }: { content: string }) {
  return (
    <Streamdown plugins={{ renderers: rechartsRenderers }}>
      {content}
    </Streamdown>
  );
}
```

Then render a chart from markdown:

````md
```recharts-json
{
  "chartType": "bar",
  "currency": "USD",
  "meta": {
    "title": "Quarterly revenue"
  },
  "xKey": "quarter",
  "series": [
    { "dataKey": "revenue", "label": "Revenue", "valueFormat": "currency" }
  ],
  "data": [
    { "quarter": "Q1", "revenue": 1200000 },
    { "quarter": "Q2", "revenue": 1500000 }
  ]
}
```
````

## Registry Files

- Component: `registry/streamdown-recharts.json`
- Example: `registry/streamdown-recharts-demo.json`
- Index: `registry/registry.json`

Regenerate registry JSON after source edits:

```bash
npm run build:registry
```
