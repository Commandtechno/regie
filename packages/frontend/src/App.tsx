import { useState } from "react";
import { Menu, X } from "lucide-react";
import Calendar from "./components/Calendar.tsx";
import Sidebar from "./components/Sidebar.tsx";
import CourseDetail from "./components/CourseDetail.tsx";
import ExportMenu from "./components/ExportMenu.tsx";
import { useScheduler } from "./hooks/useScheduler.ts";
import { useCourseSearch } from "./hooks/useCourseSearch.ts";
import { useDepartments } from "./hooks/useDepartments.ts";
import type { Course } from "./types.ts";

export default function App() {
  const scheduler = useScheduler();
  const search = useCourseSearch();
  const { departments } = useDepartments();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="shrink-0 bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-lg z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-sm text-gray-900">
            CU
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">CU Boulder</h1>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Course Scheduler</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu courses={scheduler.scheduledCourses} />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-3 overflow-hidden">
          <Calendar courses={scheduler.scheduledCourses} onCourseClick={setSelectedCourse} />
        </div>

        <div
          className={`
            w-[360px] shrink-0 border-l border-gray-200 bg-gray-50 overflow-hidden
            max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30 max-lg:shadow-2xl
            max-lg:transition-transform max-lg:duration-300
            ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:translate-x-full"}
          `}
        >
          <Sidebar
            query={search.query}
            setQuery={search.setQuery}
            filters={search.filters}
            updateFilters={search.updateFilters}
            results={search.results}
            loading={search.loading}
            total={search.total}
            page={search.page}
            totalPages={search.totalPages}
            goToPage={search.goToPage}
            departments={departments}
            scheduledCourses={scheduler.scheduledCourses}
            wishlist={scheduler.wishlist}
            totalCredits={scheduler.totalCredits}
            onAddCourse={scheduler.addCourse}
            onRemoveCourse={scheduler.removeCourse}
            onReplaceSection={scheduler.replaceSection}
            onAddToWishlist={scheduler.addToWishlist}
            onRemoveFromWishlist={scheduler.removeFromWishlist}
          />
        </div>

        {sidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black/30 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {selectedCourse && (
        <CourseDetail course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      )}
    </div>
  );
}
