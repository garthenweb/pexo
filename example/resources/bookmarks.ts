import { createRequestResource, retrieve, apply } from "../../src/request";

import { get, post, put, remove } from "../utils/api";

const API_HOST = "http://localhost:3000/api";

export const bookmarkResource = createRequestResource(
  {
    read: async function* (id?: string) {
      if (id) {
        const list = yield retrieve(bookmarkResource.get());
        const item = list?.find((item) => item.id === id);
        return item ?? get(`${API_HOST}/bookmarks/${id}`);
      }
      return get(`${API_HOST}/bookmarks`);
    },
    create: async function* (bookmark: any) {
      const request = post(`${API_HOST}/bookmarks`, bookmark);
      yield apply(bookmarkResource(), createListCreateMutation(await request));
      return request;
    },
    update: async function* (id: string, bookmark: any) {
      const request = put(`${API_HOST}/bookmarks/${id}`, bookmark);
      yield apply(bookmarkResource(), createListUpdateMutation(await request));
      return request;
    },
    delete: async function* (id: string) {
      const request = remove(`${API_HOST}/bookmarks/${id}`);
      yield apply(bookmarkResource(), createListRemoveMutation(id));
      return request;
    },
  },
  { cacheable: true, ttl: 10000 }
);

const createListCreateMutation = (nextItem: any) => (prevList: any[] = []) => {
  return [...prevList, nextItem];
};

const createListUpdateMutation = (updateItem: any) => (prevList: any[]) => {
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

const createListRemoveMutation = (id: string) => (prevList: any[]) => {
  return prevList.filter((item) => item.id !== id);
};
