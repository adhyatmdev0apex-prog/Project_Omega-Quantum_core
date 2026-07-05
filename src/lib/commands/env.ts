// commands/env.ts
import { Command, ok } from "./types";

export const envCommand: Command = {
  name: "env",
  summary: "Print environment variables",
  usage: "env",
  execute(ctx) {
    const lines = Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`);
    return ok(lines.join("\n") + (lines.length > 0 ? "\n" : ""));
  },
};
