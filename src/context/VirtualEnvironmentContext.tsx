import React, { FC, useContext } from "react";

const VirtualEnvironmentContext = React.createContext<{
  isVirtualEnvironment: boolean;
}>({
  isVirtualEnvironment: false,
});

export const useIsVirtualEnvironment = () =>
  useContext(VirtualEnvironmentContext).isVirtualEnvironment;

export const VirtualEnvironmentProvider: FC = (props) => {
  return (
    <VirtualEnvironmentContext.Provider
      value={{ isVirtualEnvironment: true }}
      children={props.children}
    />
  );
};
