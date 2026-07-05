// commands/chown.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const chownCommand: Command = {
  name: "chown",
  summary: "Change file owner and group",
  usage: "chown <owner[:group]> <file...>",
  execute(ctx) {
    if (ctx.args.length < 2) {
      return fail("chown: missing operand\n");
    }
    const [spec, ...targets] = ctx.args;
    const [owner, group] = spec.split(":");
    const errors: string[] = [];
    for (const target of targets) {
      try {
        ctx.fs.chown(target, owner, group);
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`chown: ${msg}`);
      }
    }
    if (errors.length > 0) return fail(errors.join("\n") + "\n");
    return ok("");
  },
};
