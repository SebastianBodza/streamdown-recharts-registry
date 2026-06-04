import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const registryBase = "https://bitbasti.com/r";
const repoUrl = "https://github.com/SebastianBodza/streamdown-recharts-registry";
const componentDir = "registry/default/streamdown-recharts";
const examplePath = "registry/default/examples/streamdown-recharts-demo.tsx";
const bpmnComponentDir = "registry/default/streamdown-bpmn";
const bpmnExamplePath = "registry/default/examples/streamdown-bpmn-demo.tsx";

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
const exampleContent = await readFile(examplePath, "utf8");
const bpmnComponentFiles = await readComponentFiles(
  bpmnComponentDir,
  "components/streamdown-bpmn",
);
const bpmnExampleContent = await readFile(bpmnExamplePath, "utf8");

const componentItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-recharts",
  title: "Streamdown Recharts",
  description:
    "A Streamdown custom renderer for recharts-json code fences with chart/table views and exports.",
  type: "registry:component",
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

const exampleItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-recharts-demo",
  title: "Streamdown Recharts Demo",
  description: "Example usage of the Streamdown Recharts renderer.",
  type: "registry:block",
  dependencies: ["streamdown"],
  registryDependencies: [`${registryBase}/streamdown-recharts.json`],
  files: [
    {
      path: examplePath,
      target: "components/streamdown-recharts-demo.tsx",
      type: "registry:block",
      content: exampleContent,
    },
  ],
};

const bpmnComponentItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-bpmn",
  title: "Streamdown BPMN",
  description:
    "A Streamdown custom renderer for bpmn code fences that renders interactive BPMN diagrams with zoom, fullscreen, and SVG/BPMN export.",
  type: "registry:component",
  dependencies: ["bpmn-js", "lucide-react", "streamdown"],
  files: bpmnComponentFiles,
};

const bpmnExampleItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-bpmn-demo",
  title: "Streamdown BPMN Demo",
  description: "Example usage of the Streamdown BPMN renderer.",
  type: "registry:block",
  dependencies: ["streamdown"],
  registryDependencies: [`${registryBase}/streamdown-bpmn.json`],
  files: [
    {
      path: bpmnExamplePath,
      target: "components/streamdown-bpmn-demo.tsx",
      type: "registry:block",
      content: bpmnExampleContent,
    },
  ],
};

const toRegistryItem = (item) => ({
  name: item.name,
  title: item.title,
  description: item.description,
  type: item.type,
  files: item.files.map(({ content, ...file }) => file),
});

const registry = {
  name: "streamdown-recharts-registry",
  homepage: repoUrl,
  items: [
    toRegistryItem(componentItem),
    toRegistryItem(exampleItem),
    toRegistryItem(bpmnComponentItem),
    toRegistryItem(bpmnExampleItem),
  ],
};

await writeFile("registry/streamdown-recharts.json", `${JSON.stringify(componentItem, null, 2)}\n`);
await writeFile("registry/streamdown-recharts-demo.json", `${JSON.stringify(exampleItem, null, 2)}\n`);
await writeFile("registry/streamdown-bpmn.json", `${JSON.stringify(bpmnComponentItem, null, 2)}\n`);
await writeFile("registry/streamdown-bpmn-demo.json", `${JSON.stringify(bpmnExampleItem, null, 2)}\n`);
await writeFile("registry/all.json", `${JSON.stringify(componentItem, null, 2)}\n`);
await writeFile("registry/registry.json", `${JSON.stringify(registry, null, 2)}\n`);
