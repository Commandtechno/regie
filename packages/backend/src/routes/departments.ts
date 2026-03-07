import { Hono } from "hono";
import { getCoursesCollection } from "../db.js";

const departments = new Hono();

departments.get("/", async (c) => {
  const collection = await getCoursesCollection();

  const result = await collection
    .aggregate([
      {
        $group: {
          _id: { $arrayElemAt: [{ $split: ["$code", " "] }, 0] },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { code: "$_id", count: 1, _id: 0 } },
    ])
    .toArray();

  return c.json({ departments: result });
});

export default departments;
