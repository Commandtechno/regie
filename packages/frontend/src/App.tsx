import { useState } from "react";
import { Menu, X, GraduationCap } from "lucide-react";
import Calendar from "./components/Calendar.tsx";
import Sidebar from "./components/Sidebar.tsx";
import LeftPanel from "./components/LeftPanel.tsx";
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
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="shrink-0 bg-cu-black text-white px-4 py-3 flex items-center justify-between shadow-lg z-40">
        <div className="flex items-center gap-3"></div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="My Schedule"
          >
            <GraduationCap className="w-5 h-5" />
          </button>
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
        {/* Left panel: schedule + wishlist */}
        <div
          className={`
            w-90 shrink-0 border-r border-gray-200 bg-gray-50 overflow-hidden
            max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:shadow-2xl
            max-lg:transition-transform max-lg:duration-300
            ${leftPanelOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
          `}
        >
          <LeftPanel
            scheduledCourses={scheduler.scheduledCourses}
            wishlist={scheduler.wishlist}
            totalCredits={scheduler.totalCredits}
            onAddCourse={scheduler.addCourse}
            onRemoveCourse={scheduler.removeCourse}
            onReplaceSection={scheduler.replaceSection}
            onRemoveFromWishlist={scheduler.removeFromWishlist}
            onAddToWishlist={scheduler.addToWishlist}
          />
        </div>

        {/* Center: calendar */}
        <div className="flex-1 p-3 overflow-hidden">
          <Calendar courses={scheduler.scheduledCourses} onCourseClick={setSelectedCourse} />
        </div>

        {/* Right panel: search */}
        <div
          className={`
            w-90 shrink-0 border-l border-gray-200 bg-gray-50 overflow-hidden
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
            onAddCourse={scheduler.addCourse}
            onAddToWishlist={scheduler.addToWishlist}
            onRemoveFromWishlist={scheduler.removeFromWishlist}
          />
        </div>

        {/* Mobile overlays */}
        {(sidebarOpen || leftPanelOpen) && (
          <div
            className="lg:hidden absolute inset-0 bg-black/30 z-20"
            onClick={() => {
              setSidebarOpen(false);
              setLeftPanelOpen(false);
            }}
          />
        )}
      </div>

      {selectedCourse && <CourseDetail course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
    </div>
  );
}
