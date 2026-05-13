import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { OpenSpecPluginConfig, RunResult } from "./types.js";

const OPENSPEC_CANDIDATES = ["openspec", "openspec.cmd", "openspec.exe"];

export interface RunOpts {
  cwd: string;
  args: string[];
  timeoutMs?: number;
}

export class OpenSpecRunner {
  constructor(private config: OpenSpecPluginConfig) {}

  resolveCommand(): string {
    if (this.config.command && this.config.command !== "auto") return this.config.command;
    return OPENSPEC_CANDIDATES[0];
  }

  async run(opts: RunOpts): Promise<RunResult> {
    await this.assertAllowedRoot(opts.cwd);
    const command = this.resolveCommand();
    const args = [...this.config.args, ...opts.args];
    const timeoutMs = opts.timeoutMs ?? this.config.timeoutMs;
    const env = { ...process.env, ...this.config.env };

    return new Promise<RunResult>((resolve) => {
      const child = spawn(command, args, {
        cwd: opts.cwd,
        env,
        shell: process.platform === "win32",
      });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        stderr += `\n[openspec-openclaw-plugin] timed out after ${timeoutMs}ms`;
      }, timeoutMs);
      child.stdout?.on("data", (chunk) => (stdout += chunk.toString()));
      child.stderr?.on("data", (chunk) => (stderr += chunk.toString()));
      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          exitCode: -1,
          stdout,
          stderr: stderr + `\n[openspec-openclaw-plugin] spawn error: ${err.message}`,
          command: `${command} ${args.join(" ")}`,
        });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? -1,
          stdout,
          stderr,
          command: `${command} ${args.join(" ")}`,
        });
      });
    });
  }

  private async assertAllowedRoot(cwd: string): Promise<void> {
    if (!this.config.allowedRoots.length) return;
    const abs = path.resolve(cwd);
    const ok = this.config.allowedRoots.some((root) => {
      const r = path.resolve(root);
      const rel = path.relative(r, abs);
      return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    });
    if (!ok) {
      throw new Error(`Path "${cwd}" is not inside any allowedRoots entry`);
    }
  }

  async readChangeFolder(projectPath: string, changeName: string, maxBytes = 64 * 1024): Promise<Record<string, string>> {
    const root = path.resolve(projectPath, "openspec", "changes", changeName);
    const files: Record<string, string> = {};
    await walk(root, root, files, maxBytes);
    return files;
  }
}

async function walk(base: string, dir: string, out: Record<string, string>, maxBytes: number): Promise<void> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(base, full, out, maxBytes);
      continue;
    }
    if (!entry.isFile()) continue;
    try {
      const data = await fs.readFile(full, "utf8");
      const rel = path.relative(base, full).replace(/\\/g, "/");
      out[rel] = data.length > maxBytes ? data.slice(0, maxBytes) + `\n[...truncated at ${maxBytes} bytes]` : data;
    } catch {
      // skip
    }
  }
}
