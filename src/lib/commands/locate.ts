// commands/locate.ts
// Simplified `locate`: searches the whole filesystem for paths containing
// the given substring, similar to how mlocate's database lookup behaves.
import { Command, fail, ok } from "./types";

export const locateCommand: Command = {
  name: "locate",
  summary: "Search the entire filesystem for paths containing a substring",
  usage: "locate <substring>",
  execute(ctx) {
    const query = ctx.args[0];
    if (!query) {
      return fail("locate: missing search term\n");
    }
    const all = ctx.fs.find("/", {});
    const matches = all.filter((p) => p.toLowerCase().includes(query.toLowerCase()));
    return ok(matches.join("\n") + (matches.length > 0 ? "\n" : ""));
  },
};
