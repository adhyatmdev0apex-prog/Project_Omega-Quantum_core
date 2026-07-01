// commands/ln.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const lnCommand: Command = {
  name: "ln",
  summary: "Create links between files (symbolic links via -s)",
  usage: "ln -s <target> <link_name>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (!flags.has("s")) {
      return fail("ln: only symbolic links are supported, use -s\n");
    }
    if (positional.length < 2) {
      return fail("ln: missing operand\n");
    }
    const [target, linkName] = positional;
    try {
      ctx.fs.symlink(target, linkName);
      return ok("");
    } catch (err) {
      const msg = err instanceof FSError ? err.message : String(err);
      return fail(`ln: ${msg}\n`);
    }
  },
};
