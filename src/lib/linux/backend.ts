import { LinuxBackend, SessionState, CommandResult } from "../linuxEngine";
import { VirtualFileSystem } from "./filesystem";

export class VirtualLinuxBackend {
  fs = new VirtualFileSystem();

  execute(command: string, state: SessionState): CommandResult {
    const parts = command.trim().split(/\s+/);

    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case "":
        return {
          output: "",
          exitCode: 0,
        };

      case "pwd":
        return {
          output: state.cwd,
          exitCode: 0,
        };

      case "whoami":
        return {
          output: state.user,
          exitCode: 0,
        };

      case "hostname":
        return {
          output: state.host,
          exitCode: 0,
        };

      case "history":
        return {
          output:
            state.history
              .map((x, i) => `${i + 1} ${x}`)
              .join("\n"),
          exitCode: 0,
        };

      case "help":
        return {
          output: `
Available Commands

pwd
ls
cd
mkdir
touch
cat
rm
mv
cp
whoami
hostname
history
clear
`,
          exitCode: 0,
        };

      case "clear":
        return {
          output: "",
          clear: true,
          exitCode: 0,
        };

        case "ls": {
    const files = this.fs.list(state.cwd);

    return {
        output: files.join("    "),
        exitCode: 0,
    };
}

case "cd": {
    let target = args[0];

    if (!target || target === "~") {
        target = "/home/operator";
    }

    // relative path
    if (!target.startsWith("/")) {
        if (state.cwd.endsWith("/"))
            target = state.cwd + target;
        else
            target = state.cwd + "/" + target;
    }

    // remove duplicate slashes
    target = target.replace(/\/+/g, "/");

    const node = this.fs.resolve(target);

    if (!node) {
        return {
            output: `cd: no such file or directory: ${args[0]}`,
            exitCode: 1,
        };
    }

    if (node.type !== "directory") {
        return {
            output: `cd: not a directory: ${args[0]}`,
            exitCode: 1,
        };
    }

    return {
        output: "",
        cwd: target,
        exitCode: 0,
    };


}

case "mkdir": {
    const name = parts[1];

    if (!name)
        return {
            output: "mkdir: missing operand",
            exitCode: 1,
        };

    let path = name.startsWith("/")
        ? name
        : state.cwd + "/" + name;

    if (this.fs.mkdir(path))
        return {
            output: "",
            exitCode: 0,
        };

    return {
        output: `mkdir: cannot create directory '${name}'`,
        exitCode: 1,
    };
}

case "touch": {
    const name = parts[1];

    if (!name)
        return {
            output: "touch: missing file operand",
            exitCode: 1,
        };

    let path = name.startsWith("/")
        ? name
        : state.cwd + "/" + name;

    if (this.fs.touch(path))
        return {
            output: "",
            exitCode: 0,
        };

    return {
        output: `touch: cannot create '${name}'`,
        exitCode: 1,
    };
}

case "cat": {
    const name = parts[1];

    if (!name)
        return {
            output: "cat: missing file",
            exitCode: 1,
        };

    let path = name.startsWith("/")
        ? name
        : state.cwd + "/" + name;

    const content = this.fs.cat(path);

    if (content === null)
        return {
            output: `cat: ${name}: No such file`,
            exitCode: 1,
        };

    return {
        output: content,
        exitCode: 0,
    };
}



      default:
        return {
          output: `bash: ${cmd}: command not found`,
          exitCode: 127,
        };
    }
  }
  
  
}