import { Shell } from "./shell";
import { VirtualFileSystem } from "./filesystem/filesystem";
import { CommandRegistry } from "./commands/registry";
import { allCommands } from "./commands";


export function createShell() {
    const fs = new VirtualFileSystem();

    const registry = new CommandRegistry();

    registry.registerAll(allCommands);

    return new Shell(fs, registry);
}