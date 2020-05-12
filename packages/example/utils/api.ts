class HTTPError extends Error {}

const method = (method: string) => async (url: string, body?: Object) => {
  const response = await fetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  if (!response.ok) {
    throw new HTTPError(`Fetch error: ${response.statusText}`);
  }

  return response.json();
};

export const get = method("GET");
export const post = method("POST");
export const remove = method("DELETE");
export const put = method("PUT");
