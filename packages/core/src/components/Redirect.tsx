import React from "react";
import { Redirect as RedirectRouterRoute } from "react-router-dom";
import { RedirectStatusCode } from "../utils/Redirect";

export interface RedirectChunkViewProps {
  pathname: string;
  push?: boolean;
  status?: RedirectStatusCode;
}

const Redirect = (props: RedirectChunkViewProps) => {
  if (!props || typeof props.pathname !== "string") {
    return null;
  }
  return <RedirectRouterRoute to={props.pathname} push={props.push} />;
};

export default Redirect;
