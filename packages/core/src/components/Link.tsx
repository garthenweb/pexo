import React, { FC, useCallback } from "react";
import { Link as ReactRouterLink } from "react-router-dom";
import { useClientRouterContext } from "../context/ClientRouterContext";

const Link: FC<
  React.PropsWithoutRef<{ to: string; disablePreFetching?: boolean }> &
    React.HTMLAttributes<HTMLAnchorElement>
> = ({ to, onMouseEnter, onMouseLeave, disablePreFetching, ...props }) => {
  const {
    updatePreloadUrl,
    reloadOnNavigation,
  } = useClientRouterContext();

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

  if (reloadOnNavigation) {
    return <a href={to} {...props} />;
  }

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
