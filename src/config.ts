import type { OpenSpecPluginConfig } from "./types.js";

export function resolveConfig(value: unknown): OpenSpecPluginConfig {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  return {
    enabled: raw.enabled === undefined ? true : Boolean(raw.enabled),
    command: typeof raw.command === "string" && raw.command.trim() ? raw.command.trim() : "auto",
    args: Array.isArray(raw.args)
      ? raw.args.filter((item): item is string => typeof item === "string")
      : [],
    env: readStringMap(raw.env),
    readOnly: raw.readOnly === undefined ? false : Boolean(raw.readOnly),
    allowedRoots: Array.isArray(raw.allowedRoots)
      ? raw.allowedRoots.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    timeoutMs: asPositiveInt(raw.timeoutMs, 60_000, 1000),
  };
}

function readStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

function asPositiveInt(value: unknown, fallback: number, min: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min ? value : fallback;
}
