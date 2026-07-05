// commands/tree.ts
import { Command, fail, ok, splitArgs } from "./types";
import { DirectoryNode, FSNode } from "../filesystem/types";

export const treeCommand: Command = {
  name: "tree",
  summary: "Display a directory tree",
  usage: "tree [-a] [path]",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    const target = positional[0] ?? ".";
    const showAll = flags.has("a");

    const found = ctx.fs.getNode(target);
    if (!found) {
      return fail(`tree: '${target}': No such file or directory\n`);
    }
    const root: FSNode = found;

    let dirCount = 0;
    let fileCount = 0;
    const lines: string[] = [target];

    const walk = (node: FSNode, prefix: string) => {
      if (node.type !== "directory") return;
      const children = Array.from((node as DirectoryNode).children.values())
        .filter((c) => showAll || !c.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name));

      children.forEach((child, index) => {
        const isLast = index === children.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const label = child.type === "directory" ? `${child.name}/` : child.type === "symlink" ? `${child.name}@` : child.name;
        lines.push(prefix + connector + label);
        if (child.type === "directory") {
          dirCount++;
          walk(child, prefix + (isLast ? "    " : "│   "));
        } else {
          fileCount++;
        }
      });
    };

    walk(root, "");
    lines.push("", `${dirCount} directories, ${fileCount} files`);
    return ok(lines.join("\n") + "\n");
  },
};
