const OFFLINE_CACHE_NAME = "PX_OFFLINE";

addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      await Promise.all([
        cache.add(
          new Request("/__/px.sw.header", {
            cache: "reload",
          })
        ),
        cache.add(
          new Request("/__/px.sw.footer", {
            cache: "reload",
          })
        ),
      ]);
    })()
  );
  self.skipWaiting();
});

addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
  self.clients.claim();
});

addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const networkContent = Promise.resolve(event.preloadResponse).then(
          (preloadResponse) => {
            if (preloadResponse) {
              return preloadResponse;
            }
            return fetch(event.request.url, {
              headers: {
                "service-worker-navigation-preload":
                  process.env.VERSION ?? "true",
              },
            });
          }
        );

        const parts = [
          caches.match("/__/px.sw.header"),
          networkContent,
          caches.match("/__/px.sw.footer"),
        ];

        const { done, response } = await mergeResponses(parts);
        event.waitUntil(done);
        return response;
      })()
    );
  }
});

async function mergeResponses(responsePromises, headers) {
  const { readable, writable } = new TransformStream();

  const done = (async () => {
    for await (const response of responsePromises) {
      await response.body.pipeTo(writable, { preventClose: true });
    }
    writable.getWriter().close();
  })();

  return {
    done,
    response: new Response(readable, {
      headers: headers || (await responsePromises[0]).headers,
    }),
  };
}
