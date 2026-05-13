import { Type } from "@sinclair/typebox";
import type { OpenSpecRunner } from "./runner.js";
import type { OpenSpecPluginConfig, RunResult } from "./types.js";

function json(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    details: payload,
  };
}

function requireWriteAllowed(config: OpenSpecPluginConfig) {
  if (config.readOnly) {
    throw new Error("openspec-openclaw-plugin is configured in read-only mode");
  }
}

function ok(result: RunResult) {
  return result.exitCode === 0;
}

export function registerOpenSpecTools(api: any, runner: OpenSpecRunner, config: OpenSpecPluginConfig) {
  const projectPathSchema = Type.Object({
    projectPath: Type.String({ description: "Absolute path to the project root." }),
  });

  api.registerTool({
    name: "openspec_init",
    description: "Initialize OpenSpec scaffolding in a project. Wraps `openspec init`.",
    parameters: Type.Object({
      projectPath: Type.String({ description: "Absolute path to the project root." }),
      tools: Type.Optional(Type.Array(Type.String(), { description: "Tool IDs to configure (e.g. claude, cursor, opencode). Pass [\"none\"] to skip." })),
      profile: Type.Optional(Type.String({ description: "Workflow profile, e.g. core, expanded." })),
    }),
    async execute(_id: string, params: { projectPath: string; tools?: string[]; profile?: string }) {
      requireWriteAllowed(config);
      const args = ["init", params.projectPath];
      if (params.tools && params.tools.length) args.push("--tools", params.tools.join(","));
      if (params.profile) args.push("--profile", params.profile);
      const result = await runner.run({ cwd: params.projectPath, args });
      return json({ ok: ok(result), ...result });
    },
  });

  api.registerTool({
    name: "openspec_update",
    description: "Refresh OpenSpec agent instructions in a project. Wraps `openspec update`.",
    parameters: projectPathSchema,
    async execute(_id: string, params: { projectPath: string }) {
      requireWriteAllowed(config);
      const result = await runner.run({ cwd: params.projectPath, args: ["update", params.projectPath] });
      return json({ ok: ok(result), ...result });
    },
  });

  api.registerTool({
    name: "openspec_list",
    description: "List active OpenSpec changes (default) or specs. Wraps `openspec list`.",
    parameters: Type.Object({
      projectPath: Type.String(),
      kind: Type.Optional(Type.Union([Type.Literal("changes"), Type.Literal("specs")], { description: "What to list. Default: changes." })),
    }),
    async execute(_id: string, params: { projectPath: string; kind?: "changes" | "specs" }) {
      const args = ["list", "--json"];
      if (params.kind === "specs") args.push("--specs");
      const result = await runner.run({ cwd: params.projectPath, args });
      let parsed: unknown = null;
      try { parsed = JSON.parse(result.stdout); } catch { /* keep raw */ }
      return json({ ok: ok(result), items: parsed, raw: parsed === null ? result.stdout : undefined, stderr: result.stderr || undefined });
    },
  });

  api.registerTool({
    name: "openspec_show",
    description: "Show a change or spec by name. Wraps `openspec show <name>`.",
    parameters: Type.Object({
      projectPath: Type.String(),
      name: Type.String({ description: "Change or spec name." }),
      includeFiles: Type.Optional(Type.Boolean({ description: "Also include raw file contents for change folders." })),
    }),
    async execute(_id: string, params: { projectPath: string; name: string; includeFiles?: boolean }) {
      const result = await runner.run({ cwd: params.projectPath, args: ["show", params.name] });
      const payload: Record<string, unknown> = { ok: ok(result), stdout: result.stdout, stderr: result.stderr || undefined };
      if (params.includeFiles) {
        payload.files = await runner.readChangeFolder(params.projectPath, params.name);
      }
      return json(payload);
    },
  });

  api.registerTool({
    name: "openspec_validate",
    description: "Validate change or spec artifacts. Wraps `openspec validate [name]`.",
    parameters: Type.Object({
      projectPath: Type.String(),
      name: Type.Optional(Type.String({ description: "Validate a single change/spec by name. Omit to validate everything." })),
    }),
    async execute(_id: string, params: { projectPath: string; name?: string }) {
      const args = ["validate"];
      if (params.name) args.push(params.name);
      const result = await runner.run({ cwd: params.projectPath, args });
      return json({ ok: ok(result), ...result });
    },
  });

  api.registerTool({
    name: "openspec_archive",
    description: "Archive a completed change and roll its specs into main. Wraps `openspec archive <change-name>`.",
    parameters: Type.Object({
      projectPath: Type.String(),
      changeName: Type.String(),
      yes: Type.Optional(Type.Boolean({ description: "Pass --yes to skip confirmation prompts." })),
    }),
    async execute(_id: string, params: { projectPath: string; changeName: string; yes?: boolean }) {
      requireWriteAllowed(config);
      const args = ["archive", params.changeName];
      if (params.yes !== false) args.push("--yes");
      const result = await runner.run({ cwd: params.projectPath, args });
      return json({ ok: ok(result), ...result });
    },
  });

  api.registerTool({
    name: "openspec_status",
    description: "Display artifact completion status for the active OpenSpec project (or a specific change).",
    parameters: Type.Object({
      projectPath: Type.String(),
      changeName: Type.Optional(Type.String()),
    }),
    async execute(_id: string, params: { projectPath: string; changeName?: string }) {
      const args = ["status"];
      if (params.changeName) args.push(params.changeName);
      const result = await runner.run({ cwd: params.projectPath, args });
      return json({ ok: ok(result), ...result });
    },
  });

  api.registerTool({
    name: "openspec_run",
    description: "Escape hatch: run an arbitrary openspec subcommand with raw arguments. Use only when no normalized tool fits.",
    parameters: Type.Object({
      projectPath: Type.String(),
      args: Type.Array(Type.String(), { description: "Arguments passed to the openspec CLI." }),
    }),
    async execute(_id: string, params: { projectPath: string; args: string[] }) {
      const denied = ["init", "update", "archive"].find((cmd) => params.args[0] === cmd);
      if (denied && config.readOnly) {
        throw new Error(`openspec_run blocked: read-only mode disallows "${denied}"`);
      }
      const result = await runner.run({ cwd: params.projectPath, args: params.args });
      return json({ ok: ok(result), ...result });
    },
  });
}
