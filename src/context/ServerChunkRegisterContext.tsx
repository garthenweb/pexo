import React, { FC, ComponentType } from "react";

export const ServerChunkRegisterContext = React.createContext({
  registry: new Map(),
});

interface Props {
  registry: Map<
    string,
    {
      View?: ComponentType;
      name: string;
    }
  >;
  children: JSX.Element;
}

export const ServerChunkRegisterProvider: FC<Props> = (props) => {
  return (
    <ServerChunkRegisterContext.Provider
      value={{ registry: props.registry }}
      children={props.children}
    />
  );
};
