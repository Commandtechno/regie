export interface CourseDocument {
  key: string;
  code: string;
  title: string;
  crn: string;
  no: string;
  total: string;
  schd: string;
  stat: string;
  hide: string;
  isCancelled: string;
  mpkey: string;
  meets: string;
  meetingTimes: string;
  instr: string;
  start_date: string;
  end_date: string;
  open_enroll: string;
  acad_career: string;
  cart_opts: string;
  linked_crns: string;
  auto_enroll_sections: string;
  is_enroll_section: string;
  srcdb: string;
}

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
  hide: string;
  isCancelled: string;
  mpkey: string;
  meets: string;
  meetingTimes: MeetingTime[];
  instr: string;
  start_date: string;
  end_date: string;
  open_enroll: string;
  acad_career: string;
  cart_opts: string;
  linked_crns: string;
  auto_enroll_sections: string;
  is_enroll_section: string;
  srcdb: string;
  department: string;
  courseNumber: string;
  credits: string;
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

export interface CacheEntry<T> {
  data: T;
  expiry: number;
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
