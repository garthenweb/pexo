import React, { FC } from "react";
import { Link as ReactRouterLink, LinkProps } from "react-router-dom";

const Link: FC<
  React.PropsWithoutRef<LinkProps> & React.RefAttributes<HTMLAnchorElement>
> = (props) => {
  return <ReactRouterLink {...props} />;
};

export default Link;
