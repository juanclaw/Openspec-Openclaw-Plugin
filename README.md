# openspec-openclaw-plugin

OpenClaw plugin that integrates [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`@fission-ai/openspec`) for spec-driven development inside OpenClaw sessions.

The plugin exposes a normalized tool surface so OpenClaw agents can drive the OpenSpec workflow (propose → validate → apply → archive) without shelling out manually. It ships a bundled skill (`openclaw-skills:openspec`) so any provider-backed agent picks up the right behaviour.

## Why this plugin

OpenSpec officially supports ~25 AI coding assistants (Claude Code, Cursor, OpenCode, …) but not OpenClaw. Wiring OpenSpec into OpenClaw at the plugin layer means the integration is **provider-agnostic** — swap the underlying CLI/model and the workflow keeps working.

## Install

Requires:

- OpenClaw `>= 2026.5.0`
- Node.js 20.19.0+
- `@fission-ai/openspec` available on `PATH` (`npm install -g @fission-ai/openspec@latest`)

```bash
# from a built dist
openclaw plugins install clawhub:openspec-openclaw-plugin

# or from a local checkout
git clone https://github.com/jlivanmaseda-maker/openspec-openclaw-plugin
cd openspec-openclaw-plugin
npm install --omit=peer --omit=optional --ignore-scripts
npm run build
openclaw plugins install --link "$PWD"
```

Then restart the gateway: `openclaw gateway restart`.

## Tools

| Tool | Wraps |
| --- | --- |
| `openspec_init` | `openspec init [path] [--tools …] [--profile …]` |
| `openspec_update` | `openspec update [path]` |
| `openspec_list` | `openspec list [--specs] --json` |
| `openspec_show` | `openspec show <name>` (plus optional file contents) |
| `openspec_validate` | `openspec validate [name]` |
| `openspec_archive` | `openspec archive <change-name> --yes` |
| `openspec_status` | `openspec status [change-name]` |
| `openspec_run` | Escape hatch passthrough |

## Config

`openclaw.json` → `plugins.entries["openspec-openclaw-plugin"].config`:

```json
{
  "enabled": true,
  "command": "auto",
  "args": [],
  "env": {},
  "readOnly": false,
  "allowedRoots": [],
  "timeoutMs": 60000
}
```

| Key | Default | Notes |
| --- | --- | --- |
| `enabled` | `true` | Toggle the plugin without uninstalling. |
| `command` | `"auto"` | Override the `openspec` binary path. |
| `args` | `[]` | Extra default arguments prepended to every invocation. |
| `env` | `{}` | Extra environment variables for the spawned process. |
| `readOnly` | `false` | Block `init`, `update`, `archive` (and `openspec_run` mutators). |
| `allowedRoots` | `[]` | If non-empty, restrict every operation to projects inside these absolute roots. |
| `timeoutMs` | `60000` | Per-command timeout. |

## Skill

The bundled skill (`skills/openspec/SKILL.md`) ships under `openclaw-skills:openspec`. It teaches the agent when to invoke OpenSpec, the core workflow, and anti-patterns. Extended patterns live in `skills/openspec/references/workflow.md`.

It is also published as a standalone ClawHub skill:

```bash
openclaw skills install openspec-skill
```

## License

MIT
