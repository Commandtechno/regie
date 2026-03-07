import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { getCoursesCollection } from "./db.js";
import coursesRouter from "./routes/courses.js";
import departmentsRouter from "./routes/departments.js";
import professorsRouter from "./routes/professors.js";

const app = new Hono();

app.use("*", cors());

app.route("/api/courses", coursesRouter);
app.route("/api/departments", departmentsRouter);
app.route("/api/professors", professorsRouter);

app.get("/health", async (c) => {
  const collection = await getCoursesCollection();
  const count = await collection.countDocuments();
  return c.json({ status: "ok", courses: count });
});

const port = Number(process.env.PORT || 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
