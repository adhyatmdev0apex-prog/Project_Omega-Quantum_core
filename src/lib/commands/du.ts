// commands/du.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

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

export const duCommand: Command = {
  name: "du",
  summary: "Estimate file and directory space usage",
  usage: "du [-h] [-s] [path]",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    const target = positional[0] ?? ".";
    const human = flags.has("h");
    const summaryOnly = flags.has("s");

    try {
      const entries = ctx.fs.du(target);
      const rows = summaryOnly ? entries.slice(-1) : entries;
      const out = rows
        .map((e) => `${human ? humanSize(e.size) : e.size}\t${e.path}`)
        .join("\n");
      return ok(out + (out.length > 0 ? "\n" : ""));
    } catch (err) {
      const msg = err instanceof FSError ? err.message : String(err);
      return fail(`du: ${msg}\n`);
    }
  },
};
