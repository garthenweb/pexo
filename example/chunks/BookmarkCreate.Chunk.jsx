import React, { useRef } from "react";
import { useRequest } from "../../src/context/ClientRequestContext";
import { userBookmarks, userBookmarkById } from "../resources/bookmarks";

export const View = () => {
  const request = useRequest();
  const input = useRef(null);
  return (
    <div>
      <input ref={input} placeholder="url" />
      <button
        onClick={() =>
          request(
            userBookmarkById.create({
              url: input.current.value,
            })
          )
        }
      >
        Create Bookmark
      </button>
    </div>
  );
};
