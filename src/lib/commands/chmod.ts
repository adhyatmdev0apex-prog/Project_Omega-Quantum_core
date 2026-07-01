// commands/chmod.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const chmodCommand: Command = {
  name: "chmod",
  summary: "Change file mode bits",
  usage: "chmod <mode> <file...>",
  execute(ctx) {
    if (ctx.args.length < 2) {
      return fail("chmod: missing operand\n");
    }
    const [mode, ...targets] = ctx.args;
    const errors: string[] = [];
    for (const target of targets) {
      try {
        ctx.fs.chmod(target, mode);
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`chmod: ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
