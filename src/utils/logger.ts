export const createDefaultLogger = (): Logger => ({
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
});

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (err: string | Error) => void;
}
