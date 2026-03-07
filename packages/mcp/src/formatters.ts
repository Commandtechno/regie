export interface MeetingTime {
  meet_day: string;
  start_time: string;
  end_time: string;
}

export interface Course {
  key: string;
  code: string;
  title: string;
  crn: string;
  no: string;
  total: string;
  schd: string;
  stat: string;
  meets: string;
  meetingTimes: MeetingTime[];
  instr: string;
  start_date: string;
  end_date: string;
  acad_career: string;
  credits: string;
  linked_crns: string;
  auto_enroll_sections: string;
  is_enroll_section: string;
  department: string;
  courseNumber: string;
}

export interface CoursesResponse {
  results: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Department {
  code: string;
  count: number;
}

export interface DepartmentsResponse {
  departments: Department[];
}

export interface ProfessorRating {
  firstName: string;
  lastName: string;
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  wouldTakeAgainPercent: number;
  department: string;
  link: string;
}

const DAY_NAMES: Record<string, string> = {
  "0": "Mon",
  "1": "Tue",
  "2": "Wed",
  "3": "Thu",
  "4": "Fri",
  "5": "Sat",
  "6": "Sun",
};

function formatTime(time: string): string {
  const padded = time.padStart(4, "0");
  let hours = parseInt(padded.slice(0, 2));
  const minutes = padded.slice(2);
  const period = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

function formatMeetingTimes(meetingTimes: MeetingTime[]): string {
  if (!meetingTimes || meetingTimes.length === 0) return "TBA";
  return meetingTimes
    .map((mt) => {
      const day = DAY_NAMES[mt.meet_day] || mt.meet_day;
      return `${day} ${formatTime(mt.start_time)}-${formatTime(mt.end_time)}`;
    })
    .join(", ");
}

function formatStatus(stat: string): string {
  return stat === "A" ? "Open" : "Full";
}

export function formatCoursesResponse(data: CoursesResponse): string {
  if (data.results.length === 0) {
    return `No courses found. (Total matching: ${data.total})`;
  }

  const lines: string[] = [
    `Found ${data.total} course${data.total !== 1 ? "s" : ""} (page ${data.page}/${data.totalPages}):`,
    "",
  ];

  for (const course of data.results) {
    lines.push(`${course.code} - ${course.title}`);
    lines.push(`  Section: ${course.no} | CRN: ${course.crn} | Type: ${course.schd}`);
    lines.push(`  Instructor: ${course.instr || "TBA"}`);
    lines.push(`  Schedule: ${formatMeetingTimes(course.meetingTimes)}`);
    lines.push(`  Status: ${formatStatus(course.stat)} | Seats: ${course.total} | Credits: ${course.credits || "N/A"}`);
    lines.push("");
  }

  if (data.totalPages > data.page) {
    lines.push(`Use page: ${data.page + 1} to see more results.`);
  }

  return lines.join("\n");
}

export function formatCourse(course: Course): string {
  const lines: string[] = [
    `${course.code} - ${course.title}`,
    "\u2500".repeat(60),
    `CRN:          ${course.crn}`,
    `Section:      ${course.no}`,
    `Type:         ${course.schd}`,
    `Credits:      ${course.credits || "N/A"}`,
    `Career:       ${course.acad_career}`,
    `Instructor:   ${course.instr || "TBA"}`,
    `Schedule:     ${formatMeetingTimes(course.meetingTimes)}`,
    `Status:       ${formatStatus(course.stat)}`,
    `Seats:        ${course.total}`,
    `Dates:        ${course.start_date} to ${course.end_date}`,
  ];

  if (course.linked_crns) {
    lines.push(`Linked CRNs:  ${course.linked_crns}`);
  }

  return lines.join("\n");
}

export function formatProfessorRating(rating: ProfessorRating): string {
  const wtaPercent =
    rating.wouldTakeAgainPercent >= 0
      ? `${rating.wouldTakeAgainPercent.toFixed(0)}%`
      : "N/A";

  return [
    `${rating.firstName} ${rating.lastName}`,
    "\u2500".repeat(40),
    `Rating:            ${rating.avgRating.toFixed(1)} / 5.0`,
    `Difficulty:        ${rating.avgDifficulty.toFixed(1)} / 5.0`,
    `Would Take Again:  ${wtaPercent}`,
    `Number of Ratings: ${rating.numRatings}`,
    `Department:        ${rating.department}`,
    `Profile:           ${rating.link}`,
  ].join("\n");
}

export function formatDepartments(data: DepartmentsResponse): string {
  if (data.departments.length === 0) return "No departments found.";

  const lines: string[] = [
    `${data.departments.length} departments:`,
    "",
    "Code      | Courses",
    "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
  ];

  for (const dept of data.departments) {
    lines.push(`${dept.code.padEnd(10)}| ${dept.count}`);
  }

  return lines.join("\n");
}
