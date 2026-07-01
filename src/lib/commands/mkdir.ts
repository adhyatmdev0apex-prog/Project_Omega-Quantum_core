// commands/mkdir.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const mkdirCommand: Command = {
  name: "mkdir",
  summary: "Create directories",
  usage: "mkdir [-p] <directory...>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (positional.length === 0) {
      return fail("mkdir: missing operand\n");
    }
    const parents = flags.has("p");
    const errors: string[] = [];
    for (const target of positional) {
      try {
        ctx.fs.mkdir(target, { parents });
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`mkdir: ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
