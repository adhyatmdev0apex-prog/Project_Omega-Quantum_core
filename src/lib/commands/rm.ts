// commands/rm.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const rmCommand: Command = {
  name: "rm",
  summary: "Remove files or directories",
  usage: "rm [-r] [-f] <path...>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (positional.length === 0) {
      return fail("rm: missing operand\n");
    }
    const recursive = flags.has("r") || flags.has("R") || flags.has("recursive");
    const force = flags.has("f") || flags.has("force");
    const errors: string[] = [];
    for (const target of positional) {
      try {
        ctx.fs.remove(target, { recursive, force });
      } catch (err) {
        if (force) continue;
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`rm: cannot remove '${target}': ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
