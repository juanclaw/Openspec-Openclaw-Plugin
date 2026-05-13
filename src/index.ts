import { resolveConfig } from "./config.js";
import { registerOpenSpecCli } from "./cli.js";
import { OpenSpecRunner } from "./runner.js";
import { registerOpenSpecTools } from "./toolkit.js";

interface LoggerLike {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface RegisterApi {
  pluginConfig: unknown;
  logger: LoggerLike;
  registerTool: (...args: any[]) => void;
  registerCli: (...args: any[]) => void;
  registerService: (...args: any[]) => void;
}

export function registerWith(api: RegisterApi) {
  const config = resolveConfig(api.pluginConfig);

  if (!config.enabled) {
    api.logger.info("[openspec-openclaw-plugin] plugin disabled by config");
    return;
  }

  const runner = new OpenSpecRunner(config);

  registerOpenSpecTools(api, runner, config);

  api.registerCli(
    ({ program }: any) => registerOpenSpecCli(program, runner),
    { commands: ["openspec"] },
  );

  api.registerService({
    id: "openspec-openclaw-plugin",
    start: async () => {
      api.logger.info(`[openspec-openclaw-plugin] ready (command=${config.command}, readOnly=${config.readOnly})`);
    },
    stop: async () => {
      // no persistent state
    },
  });
}

export default function register(api: RegisterApi) {
  return registerWith(api);
}
