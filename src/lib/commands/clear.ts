// commands/clear.ts
// Emits no output; a terminal UI should special-case the literal string
// "\x1bc" (or simply detect the command name "clear") to wipe its own
// scrollback, since this virtual filesystem has no notion of a screen.
import { Command, ok } from "./types";

export const clearCommand: Command = {
  name: "clear",
  summary: "Clear the terminal screen",
  usage: "clear",
  execute() {
    return ok("\x1bc");
  },
};
