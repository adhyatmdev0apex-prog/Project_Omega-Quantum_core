import { Command, ok } from "./types";

export const helpCommand: Command = {
  name: "help",
  summary: "List available commands",
  usage: "help",
  execute(ctx) {
    const cmds = ctx.registry
      ?.list()
      .map(c => c.name)
      .join("\n") ?? "";

    return ok(cmds + "\n");
  },
};