// commands/man.ts
import { Command, fail, ok } from "./types";

export const manCommand: Command = {
  name: "man",
  summary: "Display the manual page for a command",
  usage: "man <command>",
  execute(ctx) {
    const name = ctx.args[0];
    if (!name) {
      return fail("What manual page do you want?\n");
    }
    const cmd = ctx.registry?.get(name);
    if (!cmd) {
      return fail(`No manual entry for ${name}\n`);
    }
    return ok(
      [
        `NAME`,
        `    ${cmd.name} - ${cmd.summary}`,
        ``,
        `SYNOPSIS`,
        `    ${cmd.usage}`,
        ``,
      ].join("\n")
    );
  },
};
