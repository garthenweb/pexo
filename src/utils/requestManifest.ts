import path from "path";

export interface ManifestItem {
  js: string[];
  css: string[];
}

export interface Manifest {
  [bundleName: string]: ManifestItem;
}

export const createDefaultManifestRequester = (filePath?: string) => {
  const requestManifest = async ({
    shouldWatch = true,
  }): Promise<Manifest | null> => {
    try {
      return require(filePath ??
        path.join(process.cwd(), "dist", "manifest.json")) as Manifest;
    } catch {
      if (!shouldWatch) {
        return null;
      }
      return await new Promise((resolve) => {
        const tickId = setInterval(async () => {
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
