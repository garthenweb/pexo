export const createDefaultLogger = (): Logger => ({
  info: (msg) => console.info(`[${new Date().toISOString()}] [PeXo INFO]`, msg),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] [PeXo WARN]`, msg),
  error: (msg) =>
    console.error(`[${new Date().toISOString()}] [PeXo WARN]`, msg),
});

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (err: string | Error) => void;
}
