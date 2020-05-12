export type Plugin = "styled-components" | "service-worker" | undefined;

export const createPluginStyledComponents = (): Plugin => "styled-components";

export const createPluginServiceWorker = ({
  disable,
}: {
  disable?: boolean;
} = {}): Plugin => {
  return disable ? undefined : "service-worker";
};
