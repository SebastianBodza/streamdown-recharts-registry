import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const registryBase = "https://bitbasti.com/r";
const repoUrl = "https://github.com/SebastianBodza/streamdown-recharts-registry";
const componentDir = "registry/default/streamdown-recharts";
const examplePath = "registry/default/examples/streamdown-recharts-demo.tsx";

const componentFileNames = (await readdir(componentDir)).sort();
const componentFiles = await Promise.all(
  componentFileNames.map(async (fileName) => {
    const path = join(componentDir, fileName);

    return {
      content: await readFile(path, "utf8"),
      path,
      target: `components/streamdown-recharts/${fileName}`,
      type: "registry:component",
    };
  }),
);
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

const registry = {
  name: "streamdown-recharts-registry",
  homepage: repoUrl,
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
