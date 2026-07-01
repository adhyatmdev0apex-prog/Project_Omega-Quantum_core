import { Shell } from "./shell";
import { VirtualFileSystem } from "./filesystem/filesystem";
import { CommandRegistry } from "./commands/registry";

// Commands
import { lsCommand } from "./commands/ls";
import { cdCommand } from "./commands/cd";
import { pwdCommand } from "./commands/pwd";
import { mkdirCommand } from "./commands/mkdir";
import { touchCommand } from "./commands/touch";
import { catCommand } from "./commands/cat";
import { rmCommand } from "./commands/rm";
import { mvCommand } from "./commands/mv";
import { cpCommand } from "./commands/cp";
import { grepCommand } from "./commands/grep";
import { findCommand } from "./commands/find";
import { treeCommand } from "./commands/tree";
import { headCommand } from "./commands/head";
import { tailCommand } from "./commands/tail";
import { echoCommand } from "./commands/echo";
import { historyCommand } from "./commands/history";
import { clearCommand } from "./commands/clear";
//import { hostnameCommand } from "./commands/hostname";
import { whoamiCommand } from "./commands/whoami";

export function createShell() {
    const fs = new VirtualFileSystem();

    const registry = new CommandRegistry();

    registry.registerAll([
        lsCommand,
        cdCommand,
        pwdCommand,
        mkdirCommand,
        touchCommand,
        catCommand,
        rmCommand,
        mvCommand,
        cpCommand,
        grepCommand,
        findCommand,
        treeCommand,
        headCommand,
        tailCommand,
        echoCommand,
        historyCommand,
        clearCommand,
        //hostnameCommand,
        whoamiCommand,
    ]);

    return new Shell(fs, registry);
}