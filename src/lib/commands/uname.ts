// commands/uname.ts
import { Command, ok, splitArgs } from "./types";

export const unameCommand: Command = {
  name: "uname",
  summary: "Print system information",
  usage: "uname [-a]",
  execute(ctx) {
    const { flags } = splitArgs(ctx.args);
    if (flags.has("a")) {
      return ok(
        `Linux ${ctx.fs.hostname} 5.15.0-generic #1 SMP x86_64 GNU/Linux\n`
      );
    }
    return ok("Linux\n");
  },
};
