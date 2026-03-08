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
  department: string;
  courseNumber: string;
  credits: string;
  linked_crns: string;
  is_enroll_section: string;
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

export interface SearchParams {
  q?: string;
  department?: string;
  level?: string;
  schd?: string;
  career?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SchedulerState {
  scheduledCourses: Course[];
  wishlist: Course[];
}

export interface CourseGroup {
  code: string;
  title: string;
  department: string;
  courseNumber: string;
  credits: string;
  sections: Course[];
}

export interface GroupedCoursesResponse {
  results: CourseGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
