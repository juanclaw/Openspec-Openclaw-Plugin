# Changelog

## 0.1.0

Initial release.

### Added

- Plugin manifest (`openclaw.plugin.json`) targeting OpenClaw 2026.5.7 plugin API.
- 8 normalized tools wrapping the `openspec` CLI: `openspec_init`, `openspec_update`, `openspec_list`, `openspec_show`, `openspec_validate`, `openspec_archive`, `openspec_status`, `openspec_run`.
- `openclaw openspec status|list <projectPath>` CLI subcommands for direct invocation.
- Bundled skill (`openclaw-skills:openspec`) with workflow and anti-pattern guidance.
- Read-only mode, allowed-roots scoping, custom binary path, and per-command timeout via plugin config.
- Project-relative file dump for `openspec_show` (set `includeFiles: true`).
