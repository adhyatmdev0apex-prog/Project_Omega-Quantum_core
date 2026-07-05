// commands/touch.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const touchCommand: Command = {
  name: "touch",
  summary: "Create empty files or update timestamps",
  usage: "touch <file...>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("touch: missing file operand\n");
    }
    const errors: string[] = [];
    for (const target of ctx.args) {
      try {
        ctx.fs.touch(target);
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`touch: cannot touch '${target}': ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
