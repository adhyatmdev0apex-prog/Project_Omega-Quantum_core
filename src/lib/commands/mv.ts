// commands/mv.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const mvCommand: Command = {
  name: "mv",
  summary: "Move or rename files and directories",
  usage: "mv <source...> <dest>",
  execute(ctx) {
    const { positional } = splitArgs(ctx.args);
    if (positional.length < 2) {
      return fail("mv: missing file operand\n");
    }
    const dest = positional[positional.length - 1];
    const sources = positional.slice(0, -1);
    const errors: string[] = [];
    for (const src of sources) {
      try {
        ctx.fs.move(src, dest);
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`mv: cannot move '${src}' to '${dest}': ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
