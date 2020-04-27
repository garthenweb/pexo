import { createRequestResource } from "../../src/request";

const API_HOST = "http://localhost:3000/api";

export const bookmarkResource = createRequestResource({
  read: (id?: string) =>
    fetch(
      id ? `${API_HOST}/bookmarks/${id}` : `${API_HOST}/bookmarks`
    ).then((res) => res.json()),
  create: (bookmark: any) =>
    fetch(`${API_HOST}/bookmarks`, {
      method: "post",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(bookmark),
    }).then((res) => res.json()),
  update: (id: string, bookmark: any) =>
    fetch(`${API_HOST}/bookmarks/${id}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(bookmark),
    }).then((res) => res.json()),
  delete: (id: string) =>
    fetch(`${API_HOST}/bookmarks/${id}`, {
      method: "delete",
    }).then((res) => res.json()),
});
