// commands/cp.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const cpCommand: Command = {
  name: "cp",
  summary: "Copy files and directories",
  usage: "cp [-r] <source...> <dest>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (positional.length < 2) {
      return fail("cp: missing file operand\n");
    }
    const recursive = flags.has("r") || flags.has("R") || flags.has("recursive");
    const dest = positional[positional.length - 1];
    const sources = positional.slice(0, -1);
    const errors: string[] = [];
    for (const src of sources) {
      try {
        ctx.fs.copy(src, dest, { recursive });
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`cp: cannot copy '${src}' to '${dest}': ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
