import React, { FC } from "react";

const Routes: FC = ({ children }) => {
  if (process.browser) {
    return <>{children}</>;
  }

  return (
    <>
      <span data-px-server-template-routes="start" />
      {children}
      <span data-px-server-template-routes="end" />
    </>
  );
};

export default Routes;
