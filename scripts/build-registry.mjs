import { readFile, writeFile } from "node:fs/promises";

const owner = "SebastianBodza";
const repo = "streamdown-recharts-registry";
const branch = "main";
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}`;

const componentPath = "registry/default/streamdown-recharts.tsx";
const examplePath = "registry/default/examples/streamdown-recharts-demo.tsx";

const componentContent = await readFile(componentPath, "utf8");
const exampleContent = await readFile(examplePath, "utf8");

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
  files: [
    {
      path: componentPath,
      target: "components/streamdown-recharts.tsx",
      type: "registry:component",
      content: componentContent,
    },
  ],
};

const exampleItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "streamdown-recharts-demo",
  title: "Streamdown Recharts Demo",
  description: "Example usage of the Streamdown Recharts renderer.",
  type: "registry:block",
  dependencies: ["streamdown"],
  registryDependencies: [`${rawBase}/registry/streamdown-recharts.json`],
  files: [
    {
      path: examplePath,
      target: "components/streamdown-recharts-demo.tsx",
      type: "registry:block",
      content: exampleContent,
    },
  ],
};

const registry = {
  name: "streamdown-recharts-registry",
  homepage: `https://github.com/${owner}/${repo}`,
  items: [
    {
      name: componentItem.name,
      title: componentItem.title,
      description: componentItem.description,
      type: componentItem.type,
      files: componentItem.files.map(({ content, ...file }) => file),
    },
    {
      name: exampleItem.name,
      title: exampleItem.title,
      description: exampleItem.description,
      type: exampleItem.type,
      files: exampleItem.files.map(({ content, ...file }) => file),
    },
  ],
};

await writeFile("registry/streamdown-recharts.json", `${JSON.stringify(componentItem, null, 2)}\n`);
await writeFile("registry/streamdown-recharts-demo.json", `${JSON.stringify(exampleItem, null, 2)}\n`);
await writeFile("registry/all.json", `${JSON.stringify(componentItem, null, 2)}\n`);
await writeFile("registry/registry.json", `${JSON.stringify(registry, null, 2)}\n`);
