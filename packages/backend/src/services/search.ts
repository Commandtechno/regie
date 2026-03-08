import type { Document } from "mongodb";

export function buildSearchStage(q: string): Document {
  return {
    $search: {
      index: "default",
      compound: {
        should: [
          {
            autocomplete: {
              query: q,
              path: "code",
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            autocomplete: {
              query: q,
              path: "title",
              fuzzy: { maxEdits: 1 }
            }
          },
          {
            text: {
              query: q,
              path: "instr",
              fuzzy: { maxEdits: 1 }
            }
          }
        ],
        minimumShouldMatch: 1
      }
    }
  };
}

export function buildMatchStage(filters: {
  department?: string;
  level?: string;
  schd?: string;
  career?: string;
  status?: string;
  days?: string;
  startAfter?: string;
  endBefore?: string;
}): Document | null {
  const match: Document = {};

  if (filters.department) {
    match.code = { $regex: `^${filters.department}\\s`, $options: "i" };
  }

  if (filters.level) {
    const levelRegex = `\\s${filters.level[0]}\\d{3}`;
    if (match.code) {
      match.$and = [{ code: match.code }, { code: { $regex: levelRegex } }];
      delete match.code;
    } else {
      match.code = { $regex: levelRegex };
    }
  }

  if (filters.schd) match.schd = filters.schd;
  if (filters.career) match.acad_career = filters.career;
  if (filters.status) match.stat = filters.status;

  if (filters.days || filters.startAfter || filters.endBefore) {
    const timeConditions: Document[] = [];

    if (filters.days) {
      const dayList = filters.days.split(",").map(d => d.trim());
      timeConditions.push({
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ["$_parsedMeetingTimes", []] },
                  as: "mt",
                  cond: { $in: ["$$mt.meet_day", dayList] }
                }
              }
            },
            0
          ]
        }
      });
    }

    if (filters.startAfter) {
      timeConditions.push({
        $expr: {
          $allElementsTrue: {
            $map: {
              input: { $ifNull: ["$_parsedMeetingTimes", []] },
              as: "mt",
              in: { $gte: [{ $toInt: "$$mt.start_time" }, parseInt(filters.startAfter)] }
            }
          }
        }
      });
    }

    if (filters.endBefore) {
      timeConditions.push({
        $expr: {
          $allElementsTrue: {
            $map: {
              input: { $ifNull: ["$_parsedMeetingTimes", []] },
              as: "mt",
              in: { $lte: [{ $toInt: "$$mt.end_time" }, parseInt(filters.endBefore)] }
            }
          }
        }
      });
    }

    if (timeConditions.length > 0) {
      if (match.$and) {
        match.$and.push(...timeConditions);
      } else if (Object.keys(match).length > 0) {
        const existing = { ...match };
        for (const key of Object.keys(existing)) {
          delete match[key];
        }
        match.$and = [existing, ...timeConditions];
      } else {
        match.$and = timeConditions;
      }
    }
  }

  return Object.keys(match).length > 0 ? match : null;
}
