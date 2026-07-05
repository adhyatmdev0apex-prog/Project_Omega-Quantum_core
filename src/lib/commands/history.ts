// commands/history.ts
import { Command, ok } from "./types";

export const historyCommand: Command = {
  name: "history",
  summary: "Show recently executed commands",
  usage: "history",
  execute(ctx) {
    const entries = ctx.history ?? [];
    const out = entries.map((line, i) => `${String(i + 1).padStart(5)}  ${line}`).join("\n");
    return ok(out + (out.length > 0 ? "\n" : ""));
  },
};
