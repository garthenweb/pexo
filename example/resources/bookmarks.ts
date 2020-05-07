import { createRequestResource } from "../../src/request";

import { get, post, put, remove } from "../utils/api";

const API_HOST = "http://localhost:3000/api";

interface Bookmark {
  id: string;
  name: string;
}

export const bookmarkResource = createRequestResource<Bookmark[]>(
  {
    read: (id?: string) => async ({ retrieve }) => {
      if (id) {
        const list = await retrieve();
        const item = list?.find((item) => item.id === id);
        return item ?? get(`${API_HOST}/bookmarks/${id}`);
      }
      return get(`${API_HOST}/bookmarks`);
    },
    create: (bookmark: Bookmark) => async ({ apply }) => {
      const request = post(`${API_HOST}/bookmarks`, bookmark);
      await apply(createListCreateMutation(await request));
      return request;
    },
    update: (id: string, bookmark: Bookmark) => async ({ apply }) => {
      const request = put(`${API_HOST}/bookmarks/${id}`, bookmark);
      await apply(createListUpdateMutation(await request));
      return request;
    },
    delete: (id: string) => async ({ apply }) => {
      const request = remove(`${API_HOST}/bookmarks/${id}`);
      await apply(createListRemoveMutation(id));
      return request;
    },
  },
  { cacheable: true, ttl: 10000 }
);

const createListCreateMutation = (nextItem: Bookmark) => (
  prevList: Bookmark[] = []
) => {
  return [...prevList, nextItem];
};

const createListUpdateMutation = (updateItem: Bookmark) => (
  prevList: Bookmark[]
) => {
  return prevList.map((item) => {
    if (item.id === updateItem.id) {
      return {
        ...item,
        ...updateItem,
      };
    }
    return item;
  });
};

const createListRemoveMutation = (id: string) => (prevList: Bookmark[]) => {
  return prevList.filter((item) => item.id !== id);
};
