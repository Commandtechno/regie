import { Hono } from "hono";
import type { Document } from "mongodb";
import { getCoursesCollection } from "../db.js";
import { buildSearchStage, buildMatchStage } from "../services/search.js";
import type { Course, CourseDocument, MeetingTime } from "../types.js";

const courses = new Hono();

function parseCourse(doc: CourseDocument): Course {
  let meetingTimes: MeetingTime[] = [];
  try {
    meetingTimes = JSON.parse(doc.meetingTimes || "[]");
  } catch {
    meetingTimes = [];
  }

  let credits = "";
  try {
    const cartOpts = JSON.parse(doc.cart_opts || "{}");
    credits = cartOpts?.credit_hrs?.options?.[0]?.label ?? "";
  } catch {
    credits = "";
  }

  const parts = doc.code.split(" ");
  const department = parts[0] ?? "";
  const courseNumber = parts[1] ?? "";

  return {
    key: doc.key,
    code: doc.code,
    title: doc.title,
    crn: doc.crn,
    no: doc.no,
    total: doc.total,
    schd: doc.schd,
    stat: doc.stat,
    hide: doc.hide,
    isCancelled: doc.isCancelled,
    mpkey: doc.mpkey,
    meets: doc.meets,
    meetingTimes,
    instr: doc.instr,
    start_date: doc.start_date,
    end_date: doc.end_date,
    open_enroll: doc.open_enroll,
    acad_career: doc.acad_career,
    cart_opts: doc.cart_opts,
    linked_crns: doc.linked_crns,
    auto_enroll_sections: doc.auto_enroll_sections,
    is_enroll_section: doc.is_enroll_section,
    srcdb: doc.srcdb,
    department,
    courseNumber,
    credits,
  };
}

courses.get("/", async (c) => {
  const q = c.req.query("q");
  const department = c.req.query("department");
  const level = c.req.query("level");
  const schd = c.req.query("schd");
  const career = c.req.query("career");
  const status = c.req.query("status");
  const days = c.req.query("days");
  const startAfter = c.req.query("startAfter");
  const endBefore = c.req.query("endBefore");
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "25")));

  const collection = await getCoursesCollection();
  const pipeline: Document[] = [];

  if (q) {
    pipeline.push(buildSearchStage(q));
  }

  const needsTimeParsing = days || startAfter || endBefore;

  if (needsTimeParsing) {
    pipeline.push({
      $addFields: {
        _parsedMeetingTimes: {
          $cond: {
            if: { $eq: [{ $type: "$meetingTimes" }, "string"] },
            then: {
              $function: {
                body: "function(s) { try { return JSON.parse(s); } catch { return []; } }",
                args: ["$meetingTimes"],
                lang: "js",
              },
            },
            else: "$meetingTimes",
          },
        },
      },
    });
  }

  const matchStage = buildMatchStage({ department, level, schd, career, status, days, startAfter, endBefore });
  if (matchStage) {
    pipeline.push({ $match: matchStage });
  }

  if (needsTimeParsing) {
    pipeline.push({ $project: { _parsedMeetingTimes: 0 } });
  }

  pipeline.push({
    $facet: {
      results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      total: [{ $count: "count" }],
    },
  });

  const [result] = await collection.aggregate(pipeline).toArray();
  const results = ((result?.results ?? []) as CourseDocument[]).map(parseCourse);
  const total = (result?.total as { count: number }[])?.[0]?.count ?? 0;

  return c.json({
    results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

courses.get("/:crn", async (c) => {
  const crn = c.req.param("crn");
  const collection = await getCoursesCollection();
  const doc = await collection.findOne({ crn });

  if (!doc) {
    return c.json({ error: "Course not found" }, 404);
  }

  return c.json(parseCourse(doc as unknown as CourseDocument));
});

export default courses;
