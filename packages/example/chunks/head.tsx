import { HeadChunkProps } from "../../src/types/HeadChunkProps";

const btoa = process.browser
  ? globalThis.btoa
  : (str: string) => Buffer.from(str.toString(), "binary").toString("base64");

interface InputProps {
  title?: string;
  icon: string;
}

export const generateViewState = async ({
  title,
  icon,
}: InputProps): Promise<HeadChunkProps> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    title: title ? `Pexo Example: ${title}` : `Pexo Example`,
    link: [
      {
        rel: "icon",
        href: `data:image/svg+xml;base64,${btoa(
          unescape(
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`
            )
          )
        )}`,
      },
    ],
  };
};
