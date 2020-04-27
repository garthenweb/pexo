import React from "react";
import { useRequest } from "../../src/context/ClientRequestContext";
import { bookmarkResource } from "../resources/bookmarks";

export const View = ({ bookmarks }) => {
  const request = useRequest();
  return (
    <ul>
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          onDelete={() => request(bookmarkResource.delete(bookmark.id))}
          {...bookmark}
        />
      ))}
    </ul>
  );
};

export const generateViewState = async ({ userToken }, { request }) => {
  const bookmarks = await request(bookmarkResource(userToken));

  return { bookmarks };
};

const BookmarkItem = ({ url, onDelete }) => {
  return (
    <li>
      {url} <button onClick={onDelete}>x</button>
    </li>
  );
};
