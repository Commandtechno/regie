#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiGet } from "./api.js";
import {
  formatCoursesResponse,
  formatCourse,
  formatProfessorRating,
  formatDepartments,
} from "./formatters.js";
import type {
  CoursesResponse,
  Course,
  ProfessorRating,
  DepartmentsResponse,
} from "./formatters.js";

interface SearchCoursesParams {
  query?: string;
  department?: string;
  level?: string;
  schedule_type?: string;
  career?: string;
  status?: string;
  days?: string;
  start_after?: string;
  end_before?: string;
  page?: number;
  limit?: number;
}

const server = new McpServer({
  name: "cu-boulder-courses",
  version: "0.1.0",
});

const searchCoursesSchema = {
  query: z.string().optional().describe("Text search for course code, title, or instructor name"),
  department: z.string().optional().describe("Department code filter (e.g., CSCI, MATH, PHYS)"),
  level: z.enum(["1000", "2000", "3000", "4000", "5000"]).optional().describe("Course level: 1000, 2000, 3000, 4000, or 5000"),
  schedule_type: z.string().optional().describe("Schedule type: LEC, LAB, REC, SEM, etc."),
  career: z.enum(["UGRD", "GRAD", "LAW"]).optional().describe("Academic career: UGRD, GRAD, or LAW"),
  status: z.enum(["A", "F"]).optional().describe("A for available, F for full"),
  days: z.string().optional().describe("Meeting days as comma-separated codes: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri"),
  start_after: z.string().optional().describe("Minimum start time in military format (e.g., 900 for 9:00 AM)"),
  end_before: z.string().optional().describe("Maximum end time in military format (e.g., 1700 for 5:00 PM)"),
  page: z.number().optional().describe("Page number (default 1)"),
  limit: z.number().optional().describe("Results per page, max 100 (default 25)"),
};

async function handleSearchCourses(params: SearchCoursesParams) {
  try {
    const queryParams: Record<string, string> = {};
    if (params.query) queryParams.q = params.query;
    if (params.department) queryParams.department = params.department;
    if (params.level) queryParams.level = params.level;
    if (params.schedule_type) queryParams.schd = params.schedule_type;
    if (params.career) queryParams.career = params.career;
    if (params.status) queryParams.status = params.status;
    if (params.days) queryParams.days = params.days;
    if (params.start_after) queryParams.startAfter = params.start_after;
    if (params.end_before) queryParams.endBefore = params.end_before;
    if (params.page !== undefined) queryParams.page = String(params.page);
    if (params.limit !== undefined) queryParams.limit = String(params.limit);

    const data = await apiGet<CoursesResponse>("/api/courses", queryParams);
    return { content: [{ type: "text" as const, text: formatCoursesResponse(data) }] };
  } catch (error) {
    return {
      content: [{ type: "text" as const, text: `Error searching courses: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}

// @ts-expect-error - TS2589: Type instantiation depth limit with 11-property Zod schema in MCP SDK generics
server.tool(
  "search_courses",
  "Search CU Boulder courses by text query, department, level, schedule type, and more. Returns paginated results.",
  searchCoursesSchema,
  handleSearchCourses
);

server.tool(
  "get_course",
  "Get full details for a specific course section by its CRN (Course Reference Number)",
  {
    crn: z.string().describe("Course Reference Number (CRN)"),
  },
  async (params) => {
    try {
      const course = await apiGet<Course>(`/api/courses/${params.crn}`);
      return { content: [{ type: "text" as const, text: formatCourse(course) }] };
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return { content: [{ type: "text" as const, text: `No course found with CRN "${params.crn}".` }] };
      }
      return {
        content: [{ type: "text" as const, text: `Error fetching course: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_professor_rating",
  "Look up a professor's rating on RateMyProfessors for CU Boulder",
  {
    name: z.string().describe("Professor name (e.g., 'J. Contreras' or 'John Smith')"),
  },
  async (params) => {
    try {
      const rating = await apiGet<ProfessorRating>("/api/professors/rating", { name: params.name });
      return { content: [{ type: "text" as const, text: formatProfessorRating(rating) }] };
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return { content: [{ type: "text" as const, text: `No RateMyProfessors rating found for "${params.name}" at CU Boulder.` }] };
      }
      return {
        content: [{ type: "text" as const, text: `Error looking up professor rating: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "list_departments",
  "List all academic departments with their course counts",
  {},
  async () => {
    try {
      const data = await apiGet<DepartmentsResponse>("/api/departments");
      return { content: [{ type: "text" as const, text: formatDepartments(data) }] };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: `Error listing departments: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
