// commands/whoami.ts
import { Command, ok } from "./types";

export const whoamiCommand: Command = {
  name: "whoami",
  summary: "Print the current username",
  usage: "whoami",
  execute(ctx) {
    return ok(ctx.fs.currentUser.username + "\n");
  },
};
