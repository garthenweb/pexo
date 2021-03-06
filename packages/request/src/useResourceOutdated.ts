import { useState, useEffect } from "react";
import { Request } from "./request.types";

const calcIsOutdated = (
  resourcesUpdatedAt: (number | undefined)[],
  viewUpdatedAt: number | undefined
) => {
  if (viewUpdatedAt === undefined) {
    return true;
  }
  return resourcesUpdatedAt
    .filter(<T>(createdAt?: T): createdAt is T => Boolean(createdAt))
    .some((resourceUpdatedAt) => resourceUpdatedAt > viewUpdatedAt);
};

export const useResourceOutdated = (
  request: Request,
  resourceIds: string[],
  lastUpdatedAt: number | undefined
) => {
  const [resourcesUpdatedAt, setResourcesUpdatedAt] = useState(
    request.getUpdateAtForResourceIds(resourceIds)
  );

  useEffect(() => {
    const update = (updatedResourceId: string) => {
      if (!resourceIds.includes(updatedResourceId)) {
        return;
      }
      setResourcesUpdatedAt(request.getUpdateAtForResourceIds(resourceIds));
    };
    request.addResourceUpdatedListener(update);
    return () => request.removeResourceUpdatedListener(update);
  }, [request, setResourcesUpdatedAt, resourceIds.join(",")]);

  return calcIsOutdated(resourcesUpdatedAt, lastUpdatedAt);
};
