import { useState, useEffect } from "react";
import { Request } from "./types";

export const useResourceInvalidator = (
  request: Request,
  resourceIds?: string[]
) => {
  const [isInvalid, setIsInvalid] = useState(
    request.isOneResourceInvalid(resourceIds ?? [])
  );
  useEffect(() => {
    const update = () => {
      setIsInvalid(request.isOneResourceInvalid(resourceIds ?? []));
    };
    request.addResourceInvalidationChangeListener(update);
    return () => request.removeResourceInvalidationChangeListener(update);
  }, [request, resourceIds?.join(",")]);

  return isInvalid;
};
