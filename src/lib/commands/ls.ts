// commands/ls.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSNode } from "../filesystem/types";
import { permissionsToString } from "../filesystem/permissions";
import { FSError } from "../filesystem/types";

function formatDate(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, " ")} ${hh}:${mm}`;
}

function colorize(node: FSNode): string {
  if (node.type === "directory") return `${node.name}/`;
  if (node.type === "symlink") return `${node.name}@`;
  return node.name;
}

export const lsCommand: Command = {
  name: "ls",
  summary: "List directory contents",
  usage: "ls [-l] [-a] [-h] [path...]",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    const targets = positional.length > 0 ? positional : ["."];
    const long = flags.has("l");
    const showAll = flags.has("a") || flags.has("all");
    const human = flags.has("h");

    const outputs: string[] = [];
    let hadError = false;

    for (const target of targets) {
      try {
        let entries: FSNode[];
        const node = ctx.fs.getNode(target, true);
        if (node && node.type !== "directory") {
          entries = [node];
        } else {
          entries = ctx.fs.listDir(target);
        }

        const visible = showAll ? entries : entries.filter((e) => !e.name.startsWith("."));

        if (targets.length > 1) {
          outputs.push(`${target}:`);
        }

        if (long) {
          for (const entry of visible) {
            const size = ctx.fs.sizeOf(entry);
            const sizeStr = human ? humanSize(size) : String(size);
            outputs.push(
              `${permissionsToString(entry)} ${entry.owner.padEnd(8)} ${entry.group.padEnd(8)} ${sizeStr.padStart(
                8
              )} ${formatDate(entry.modifiedAt)} ${colorize(entry)}`
            );
          }
        } else {
          outputs.push(visible.map(colorize).join("  "));
        }

        if (targets.length > 1) outputs.push("");
      } catch (err) {
        hadError = true;
        const msg = err instanceof FSError ? err.message : String(err);
        outputs.push(`ls: cannot access '${target}': ${msg}`);
      }
    }

    const text = outputs.join("\n").replace(/\n+$/, "\n");
    return hadError ? fail(text, 1) : ok(text.endsWith("\n") ? text : text + "\n");
  },
};

function humanSize(bytes: number): string {
  const units = ["B", "K", "M", "G", "T"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size % 1 === 0 ? size : size.toFixed(1)}${units[unitIndex]}`;
}
