import { useEffect } from "react";

export const useIdleCallback = (
  callback: () => (() => void) | void,
  opts?: RequestIdleCallbackOptions
) => {
  useEffect(() => {
    let unmount: (() => void) | void = void 0;
    const handleId = window.requestIdleCallback(() => {
      unmount = callback();
    }, opts);

    return () => {
      window.cancelIdleCallback(handleId);
      if (unmount) {
        unmount();
      }
    };
  }, [callback]);
};

type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
  timeout: number;
};
type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};

declare global {
  interface Window {
    requestIdleCallback: (
      callback: (deadline: RequestIdleCallbackDeadline) => void,
      opts?: RequestIdleCallbackOptions
    ) => RequestIdleCallbackHandle;
    cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void;
  }
}
