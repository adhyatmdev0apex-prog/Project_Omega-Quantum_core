// commands/df.ts
import { Command, ok, splitArgs } from "./types";

function humanSize(kb: number): string {
  const units = ["K", "M", "G", "T"];
  let size = kb;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size % 1 === 0 ? size : size.toFixed(1)}${units[unitIndex]}`;
}

export const dfCommand: Command = {
  name: "df",
  summary: "Report filesystem disk space usage",
  usage: "df [-h]",
  execute(ctx) {
    const { flags } = splitArgs(ctx.args);
    const human = flags.has("h");
    const rows = ctx.fs.df();
    const header = "Filesystem     1K-blocks      Used Available Use% Mounted on";
    const lines = rows.map((r) => {
      const size = human ? humanSize(r.sizeKb) : String(r.sizeKb);
      const used = human ? humanSize(r.usedKb) : String(r.usedKb);
      const avail = human ? humanSize(r.availKb) : String(r.availKb);
      return `${r.filesystem.padEnd(14)} ${size.padStart(9)} ${used.padStart(9)} ${avail.padStart(
        9
      )} ${String(r.usePercent + "%").padStart(4)} ${r.mountedOn}`;
    });
    return ok([header, ...lines].join("\n") + "\n");
  },
};
