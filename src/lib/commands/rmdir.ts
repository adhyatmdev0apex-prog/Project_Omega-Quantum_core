// commands/rmdir.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const rmdirCommand: Command = {
  name: "rmdir",
  summary: "Remove empty directories",
  usage: "rmdir <directory...>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("rmdir: missing operand\n");
    }
    const errors: string[] = [];
    for (const target of ctx.args) {
      try {
        ctx.fs.rmdir(target);
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`rmdir: failed to remove '${target}': ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
