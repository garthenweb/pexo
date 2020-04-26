import { createRequestResource } from "../../src/request";

export const userBookmarks = createRequestResource(
  () => fetch("http://localhost:3000/api/bookmarks").then((res) => res.json()),
  {
    cacheable: true,
    ttl: 5000,
  }
);

export const userBookmarkById = createRequestResource({
  read: (id) =>
    fetch(`http://localhost:3000/api/bookmarks/${id}`).then((res) =>
      res.json()
    ),
  create: (bookmark) =>
    fetch(`http://localhost:3000/api/bookmarks`, {
      method: "post",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(bookmark),
    }).then((res) => res.json()),
  update: (id, bookmark) =>
    fetch(`http://localhost:3000/api/bookmarks/${id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(bookmark),
    }).then((res) => res.json()),
  delete: (id) =>
    fetch(`http://localhost:3000/api/bookmarks/${id}`, {
      method: "delete",
    }).then((res) => res.json()),
});

// connectResources([userBookmarks, userBookmarkById]);
