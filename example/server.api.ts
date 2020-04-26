import express from "express";

const createApi = (expressApp: express.Express) => {
  const bookmarks = new Map();
  let nextId = 0;
  expressApp.use("/api/*", express.json());
  expressApp.get("/api/bookmarks", (req, res) => {
    res.json(Array.from(bookmarks.values()));
  });

  expressApp.post("/api/bookmarks", (req, res) => {
    const bookmark = Object.assign({ id: (++nextId).toString() }, req.body);
    bookmarks.set(bookmark.id, bookmark);
    res.json(bookmark);
  });

  expressApp.get("/api/bookmarks/:id", (req, res) => {
    res.json(bookmarks.get(req.params.id));
  });

  expressApp.put("/api/bookmarks/:id", (req, res) => {
    const bookmark = Object.assign(bookmarks.get(req.params.id), req.body);
    bookmarks.set(req.params.id, bookmark);
    res.json(bookmark);
  });

  expressApp.delete("/api/bookmarks/:id", (req, res) => {
    const bookmark = bookmarks.get(req.params.id);
    bookmarks.delete(req.params.id);
    res.json(bookmark);
  });
};

export default createApi;
