// commands/id.ts
import { Command, ok } from "./types";

export const idCommand: Command = {
  name: "id",
  summary: "Print user and group IDs",
  usage: "id",
  execute(ctx) {
    const u = ctx.fs.currentUser;
    const groupList = u.groups.map((g, i) => `${1000 + i}(${g})`).join(",");
    return ok(`uid=${u.uid}(${u.username}) gid=${u.gid}(${u.username}) groups=${groupList}\n`);
  },
};
