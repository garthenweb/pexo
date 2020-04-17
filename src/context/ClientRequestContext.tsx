import React, { useContext } from "react";
import { createRequest, Request } from "../request";

const RequestContext = React.createContext<Request>(createRequest());

export const useRequest = () => useContext(RequestContext);
