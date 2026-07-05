// commands/readlink.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const readlinkCommand: Command = {
  name: "readlink",
  summary: "Print the resolved value of a symbolic link",
  usage: "readlink [-f] <path>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (positional.length === 0) {
      return fail("readlink: missing operand\n");
    }
    const target = positional[0];
    try {
      if (flags.has("f")) {
        return ok(ctx.fs.realpath(target) + "\n");
      }
      return ok(ctx.fs.readlink(target) + "\n");
    } catch (err) {
      const msg = err instanceof FSError ? err.message : String(err);
      return fail(`readlink: ${msg}\n`);
    }
  },
};
