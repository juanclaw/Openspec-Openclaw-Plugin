import type { OpenSpecRunner } from "./runner.js";

interface ProgramLike {
  command(name: string): {
    description(text: string): any;
    argument(spec: string, desc: string): any;
    action(fn: (...args: any[]) => any): any;
  };
}

export function registerOpenSpecCli(program: ProgramLike, runner: OpenSpecRunner) {
  const root = program.command("openspec").description("Inspect and run OpenSpec workflows from OpenClaw");

  root
    .command("status")
    .description("Show OpenSpec status for a project")
    .argument("<projectPath>", "Project path")
    .action(async (projectPath: string) => {
      const result = await runner.run({ cwd: projectPath, args: ["status"] });
      process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      process.exit(result.exitCode);
    });

  root
    .command("list")
    .description("List OpenSpec changes for a project")
    .argument("<projectPath>", "Project path")
    .action(async (projectPath: string) => {
      const result = await runner.run({ cwd: projectPath, args: ["list"] });
      process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      process.exit(result.exitCode);
    });
}
