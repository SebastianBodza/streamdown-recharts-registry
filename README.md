# Streamdown Recharts Registry

A small shadcn registry for a Streamdown custom renderer that turns fenced
`recharts-json` blocks into Recharts visualizations.

## Install

```bash
npx shadcn@latest add https://bitbasti.com/r/streamdown-recharts.json
```

This installs the renderer as a small component module:

```text
components/streamdown-recharts/
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

`locale` and `currency` are optional. If omitted, numbers default to `en-US`
and currency values default to `USD`.

## AI SDK System Prompt Hint

When using the Vercel AI SDK, add a short system prompt that teaches the model
when and how to emit `recharts-json` fences.

```ts
import { streamText } from "ai";

const chartSystemPrompt = `
When the user asks for a chart, return a fenced recharts-json block.
Use valid JSON only inside the fence.
Supported chartType values are bar, line, area, pie, and scatter.
Include locale and currency when relevant, for example "locale": "de-DE" and "currency": "EUR".
`;

const result = streamText({
  model,
  system: chartSystemPrompt,
  messages,
});
```

Example model output:

````md
```recharts-json
{
  "chartType": "line",
  "locale": "de-DE",
  "currency": "EUR",
  "meta": {
    "title": "Monthly revenue"
  },
  "xKey": "month",
  "series": [
    { "dataKey": "revenue", "label": "Revenue", "valueFormat": "currency" }
  ],
  "data": [
    { "month": "Jan", "revenue": 12000 },
    { "month": "Feb", "revenue": 18500 }
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
