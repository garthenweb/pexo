import { RedirectChunkViewProps } from "../../packages/core/src/components";

interface InputProps {
  pathname: string;
}

export const generateViewState = (
  inputProps: InputProps
): Promise<RedirectChunkViewProps> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (inputProps.pathname.includes("redirect")) {
        return resolve({
          pathname: "/",
        });
      }
      resolve();
    }, 400);
  });
};
