import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const repoUrl = "https://github.com/SebastianBodza/streamdown-recharts-registry";
const componentDir = "registry/default/streamdown-recharts";
const bpmnComponentDir = "registry/default/streamdown-bpmn";

const readComponentFiles = async (dir, targetDir) => {
  const fileNames = (await readdir(dir)).sort();

  return Promise.all(
    fileNames.map(async (fileName) => {
      const path = join(dir, fileName);

      return {
        content: await readFile(path, "utf8"),
        path,
        target: `${targetDir}/${fileName}`,
        type: "registry:component",
      };
    }),
  );
};

const componentFiles = await readComponentFiles(
  componentDir,
  "components/streamdown-recharts",
);
const bpmnComponentFiles = await readComponentFiles(
  bpmnComponentDir,
  "components/streamdown-bpmn",
);

const componentItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-recharts",
  title: "Streamdown Recharts",
  description:
    "A Streamdown custom renderer for recharts-json code fences with chart/table views and exports.",
  type: "registry:component",
  categories: ["streamdown", "ai", "charts", "data-visualization", "recharts"],
  dependencies: [
    "@e965/xlsx",
    "html-to-image",
    "lucide-react",
    "recharts",
    "streamdown",
    "zod",
  ],
  registryDependencies: ["button", "dropdown-menu"],
  cssVars: {
    light: {
      "chart-1": "oklch(0.646 0.222 41.116)",
      "chart-2": "oklch(0.6 0.118 184.704)",
      "chart-3": "oklch(0.398 0.07 227.392)",
      "chart-4": "oklch(0.828 0.189 84.429)",
      "chart-5": "oklch(0.769 0.188 70.08)",
    },
    dark: {
      "chart-1": "oklch(0.488 0.243 264.376)",
      "chart-2": "oklch(0.696 0.17 162.48)",
      "chart-3": "oklch(0.769 0.188 70.08)",
      "chart-4": "oklch(0.627 0.265 303.9)",
      "chart-5": "oklch(0.645 0.246 16.439)",
    },
  },
  files: componentFiles,
};

const bpmnComponentItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-bpmn",
  title: "Streamdown BPMN",
  description:
    "A Streamdown custom renderer for bpmn code fences that renders interactive BPMN diagrams with zoom, fullscreen, and SVG/BPMN export.",
  type: "registry:component",
  categories: ["streamdown", "ai", "bpmn", "diagrams", "workflow"],
  dependencies: ["bpmn-js", "lucide-react", "streamdown"],
  files: bpmnComponentFiles,
};

const toRegistryItem = (item) => ({
  name: item.name,
  title: item.title,
  description: item.description,
  type: item.type,
  ...(item.categories ? { categories: item.categories } : {}),
  files: item.files.map(({ content, ...file }) => file),
});

const registry = {
  name: "streamdown-recharts-registry",
  homepage: repoUrl,
  items: [toRegistryItem(componentItem), toRegistryItem(bpmnComponentItem)],
};

await writeFile("registry/streamdown-recharts.json", `${JSON.stringify(componentItem, null, 2)}\n`);
await writeFile("registry/streamdown-bpmn.json", `${JSON.stringify(bpmnComponentItem, null, 2)}\n`);
await writeFile("registry/registry.json", `${JSON.stringify(registry, null, 2)}\n`);
