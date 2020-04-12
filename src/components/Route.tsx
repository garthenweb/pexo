import React, { FC } from "react";
import { Route as ReactRouterRoute, RouteProps } from "react-router-dom";

const Link: FC<RouteProps> = (props) => {
  return <ReactRouterRoute exact {...props} />;
};

export default Link;
