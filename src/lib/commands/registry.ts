// commands/registry.ts
// Central, pluggable command registry. No switch statements: commands
// register themselves into a Map and are looked up by name at dispatch time.

import { Command } from "./types";

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  public register(command: Command): void {
    if (this.commands.has(command.name)) {
      throw new Error(`Command already registered: '${command.name}'`);
    }
    this.commands.set(command.name, command);
  }

  public registerAll(commands: Command[]): void {
    for (const cmd of commands) this.register(cmd);
  }

  public get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public has(name: string): boolean {
    return this.commands.has(name);
  }

  public list(): Command[] {
    return Array.from(this.commands.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  public names(): string[] {
    return this.list().map((c) => c.name);
  }
}
