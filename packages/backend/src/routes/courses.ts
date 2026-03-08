import { Hono } from "hono";
import type { Document } from "mongodb";
import { getCoursesCollection } from "../db.js";
import { buildSearchStage, buildMatchStage } from "../services/search.js";
import type { Course, CourseDocument, MeetingTime, CourseGroup } from "../types.js";

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

function parseGroup(doc: Document): CourseGroup {
  const sections = (doc.sections as CourseDocument[]).map(parseCourse);

  // Sort sections: available first, then by no ascending
  sections.sort((a, b) => {
    if (a.stat === "A" && b.stat !== "A") return -1;
    if (a.stat !== "A" && b.stat === "A") return 1;
    return a.no.localeCompare(b.no, undefined, { numeric: true });
  });

  const firstSection = sections[0];
  const parts = firstSection.code.split(" ");
  const department = parts[0] ?? "";
  const courseNumber = parts[1] ?? "";

  return {
    code: doc._id as string,
    title: doc.title as string,
    department,
    courseNumber,
    credits: firstSection.credits,
    sections,
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
  const grouped = c.req.query("grouped") === "true";
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "25")));

  const collection = await getCoursesCollection();
  const pipeline: Document[] = [];

  if (q) {
    pipeline.push(buildSearchStage(q));
    // Capture search score for sorting before grouping
    pipeline.push({
      $addFields: {
        _searchScore: { $meta: "searchScore" },
      },
    });
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

  if (grouped) {
    // Sort by search score if searching, otherwise by code ascending
    if (q) {
      pipeline.push({ $sort: { _searchScore: -1 } });
    } else {
      pipeline.push({ $sort: { code: 1, no: 1 } });
    }

    // Group by course code
    const groupStage: Document = {
      _id: "$code",
      title: { $first: "$title" },
      sections: { $push: "$$ROOT" },
    };

    if (q) {
      groupStage._maxScore = { $max: "$_searchScore" };
    }

    pipeline.push({ $group: groupStage });

    // Sort groups by max search score if searching, otherwise by code ascending
    if (q) {
      pipeline.push({ $sort: { _maxScore: -1 } });
    } else {
      pipeline.push({ $sort: { _id: 1 } });
    }

    // Facet for pagination on groups
    pipeline.push({
      $facet: {
        results: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    });

    const [result] = await collection.aggregate(pipeline).toArray();
    const groups = ((result?.results ?? []) as Document[]).map(parseGroup);
    const total = (result?.total as { count: number }[])?.[0]?.count ?? 0;

    return c.json({
      results: groups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } else {
    // Original non-grouped behavior
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
  }
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
