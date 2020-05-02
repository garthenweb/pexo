import React from "react";
import { useRequest } from "../../src/context/ClientRequestContext";
import { bookmarkResource } from "../resources/bookmarks";

export const View = ({ bookmarks }) => {
  const request = useRequest();
  return (
    <ul>
      {bookmarks.map((bookmark, index) => (
        <BookmarkItem
          key={index}
          onDelete={() => request(bookmarkResource.delete(bookmark.id))}
          {...bookmark}
        />
      ))}
    </ul>
  );
};

export const generateViewState = async (_, { request }) => {
  const bookmarks = await request(bookmarkResource());

  return { bookmarks };
};

const BookmarkItem = ({ url, onDelete }) => {
  return (
    <li>
      {url} <button onClick={onDelete}>x</button>
    </li>
  );
};
