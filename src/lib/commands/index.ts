// commands/index.ts
// Aggregates every pluggable command for easy bulk registration.

import { Command } from "./types";
import { pwdCommand } from "./pwd";
import { lsCommand } from "./ls";
import { cdCommand } from "./cd";
import { mkdirCommand } from "./mkdir";
import { rmdirCommand } from "./rmdir";
import { touchCommand } from "./touch";
import { rmCommand } from "./rm";
import { mvCommand } from "./mv";
import { cpCommand } from "./cp";
import { catCommand } from "./cat";
import { echoCommand } from "./echo";
import { headCommand } from "./head";
import { tailCommand } from "./tail";
import { treeCommand } from "./tree";
import { findCommand } from "./find";
import { locateCommand } from "./locate";
import { grepCommand } from "./grep";
import { chmodCommand } from "./chmod";
import { chownCommand } from "./chown";
import { statCommand } from "./stat";
import { fileCommand } from "./file";
import { lnCommand } from "./ln";
import { readlinkCommand } from "./readlink";
import { basenameCommand } from "./basename";
import { dirnameCommand } from "./dirname";
import { realpathCommand } from "./realpath";
import { duCommand } from "./du";
import { dfCommand } from "./df";
import { whoamiCommand } from "./whoami";
import { idCommand } from "./id";
import { unameCommand } from "./uname";
import { envCommand } from "./env";
import { whichCommand } from "./which";
import { manCommand } from "./man";
import { historyCommand } from "./history";
import { clearCommand } from "./clear";

export const allCommands: Command[] = [
  pwdCommand,
  lsCommand,
  cdCommand,
  mkdirCommand,
  rmdirCommand,
  touchCommand,
  rmCommand,
  mvCommand,
  cpCommand,
  catCommand,
  echoCommand,
  headCommand,
  tailCommand,
  treeCommand,
  findCommand,
  locateCommand,
  grepCommand,
  chmodCommand,
  chownCommand,
  statCommand,
  fileCommand,
  lnCommand,
  readlinkCommand,
  basenameCommand,
  dirnameCommand,
  realpathCommand,
  duCommand,
  dfCommand,
  whoamiCommand,
  idCommand,
  unameCommand,
  envCommand,
  whichCommand,
  manCommand,
  historyCommand,
  clearCommand,
];

export * from "./types";
export * from "./registry";
