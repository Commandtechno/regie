import { Hono } from "hono";
import { getProfessorRating } from "../services/rmp.js";

const professors = new Hono();

professors.get("/rating", async (c) => {
  const name = c.req.query("name");

  if (!name) {
    return c.json({ error: "name query parameter is required" }, 400);
  }

  const rating = await getProfessorRating(name);

  if (!rating) {
    return c.body(null, 404);
  }

  return c.json(rating);
});

export default professors;
