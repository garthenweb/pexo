import path from "path";
import { Logger } from "./logger";

export interface ManifestItem {
  js: string[];
  css: string[];
  isEntry: boolean;
}

export interface Manifest {
  [bundleName: string]: ManifestItem;
}

export const createDefaultManifestRequester = (
  logger: Logger,
  filePath?: string
) => {
  const manifestRequirePath =
    filePath ?? path.join(process.cwd(), "dist", "manifest.json");
  const requestManifest = async ({
    shouldWatch = true,
  }): Promise<Manifest | null> => {
    if (shouldWatch) {
      try {
        delete require.cache[require.resolve(manifestRequirePath)];
      } catch {}
    }
    try {
      return require(manifestRequirePath) as Manifest;
    } catch {
      if (!shouldWatch) {
        return null;
      }
      return await new Promise((resolve) => {
        let retires = 0;
        const tickId = setInterval(async () => {
          if (retires % 10 === 0) {
            logger.info(
              `Waiting for manifest.json to be created by the client bundler... Retry count: ${retires}`
            );
          }
          retires++;
          const manifest = await requestManifest({ shouldWatch: false });
          if (manifest) {
            clearInterval(tickId);
            resolve(manifest);
          }
        }, 1000);
      });
    }
  };

  return requestManifest;
};
