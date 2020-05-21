import React, { useContext } from "react";
import {
  createRequest,
  Request,
  createAsyncCache,
  AsyncCache,
} from "@pexo/request";

const defaultCache = createAsyncCache();
const cache: AsyncCache = {
  get: async (key) => {
    const value = await defaultCache.get(key);
    if (value) {
      return value;
    }
    const script = document.querySelector(
      `script[data-px-hydration-resource-key="${key}"]`
    );
    if (script) {
      const value = JSON.parse(script.innerHTML);
      script.parentNode?.removeChild(script);
      await defaultCache.set(key, value);
      return value;
    }
    return undefined;
  },
  set: defaultCache.set.bind(defaultCache),
  delete: defaultCache.delete.bind(defaultCache),
  entries: defaultCache.entries.bind(defaultCache),
};

const RequestContext = React.createContext<Request>(
  createRequest({
    cache,
  })
);

export const useRequest = () => useContext(RequestContext);
