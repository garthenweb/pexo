export const createDefaultLogger = (): Logger => ({
  info: (msg) => console.info(`[${new Date().toISOString()}] [PoXi INFO]`, msg),
  warn: (msg) => console.info(`[${new Date().toISOString()}] [PoXi WARN]`, msg),
  error: (msg) =>
    console.info(`[${new Date().toISOString()}] [PoXi WARN]`, msg),
});

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (err: string | Error) => void;
}
