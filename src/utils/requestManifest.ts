import path from "path";

export interface ManifestItem {
  js: string[];
  css: string[];
}

export interface Manifest {
  [bundleName: string]: ManifestItem;
}

export const createDefaultManifestRequester = (filePath?: string) => {
  return () => {
    return Promise.resolve(
      require(filePath ?? path.join(process.cwd(), "manifest.json")) as Manifest
    );
  };
};
