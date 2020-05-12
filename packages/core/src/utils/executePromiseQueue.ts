/**
 * Excepts an array of promises, executes them in order and triggers a handler as soon as the next item in the queue resolves.
 * Resolves as soon as all promises in the queue resolve or rejects as soon as the first item in the queue rejects
 */
export const executePromiseQueue = <T = any>(
  promises: Promise<T>[],
  handler: (p: T) => void
) =>
  promises.reduce(
    (queue, chunk) => queue.then(() => chunk).then(handler),
    Promise.resolve()
  );
