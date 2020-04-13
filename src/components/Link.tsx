import React, { FC, useCallback } from "react";
import { Link as ReactRouterLink } from "react-router-dom";
import { useClientRouterContext } from "../context/ClientRouterContext";

const Link: FC<
  React.PropsWithoutRef<{ to: string; disablePreFetching?: boolean }> &
    React.RefAttributes<HTMLAnchorElement>
> = ({ to, onMouseEnter, onMouseLeave, disablePreFetching, ...props }) => {
  const { updatePreloadUrl } = useClientRouterContext();

  const extendedOnMouseEnter = useCallback(
    (ev) => {
      if (!disablePreFetching) {
        updatePreloadUrl(to);
      }
      onMouseEnter?.(ev);
    },
    [to, onMouseEnter, updatePreloadUrl]
  );

  const extendedOnMouseLeave = useCallback(
    (ev) => {
      if (!disablePreFetching) {
        updatePreloadUrl(null);
      }
      onMouseLeave?.(ev);
    },
    [onMouseLeave, updatePreloadUrl]
  );

  return (
    <ReactRouterLink
      {...props}
      to={to}
      onMouseEnter={extendedOnMouseEnter}
      onMouseLeave={extendedOnMouseLeave}
    />
  );
};

export default Link;
