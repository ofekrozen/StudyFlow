import React from 'react';

// Fake Data for UI purposes
const SEMESTER_PROGRESS = 42; // percentage
const TASKS = [
  { id: 1, title: 'Upload Notes: CS101', type: 'upload_notes', time: 'Due in 2 hrs', priority: 'high' },
  { id: 2, title: 'Daily Review: Calc II', type: 'daily_review', time: 'Due today', priority: 'medium' },
  { id: 3, title: 'Concept Check: Physics', type: 'concept_check', time: 'Due tomorrow', priority: 'low' },
];

const COURSES = [
  { id: 1, title: 'Intro to Computer Science', code: 'CS101', milestone: 'Midterm in 12 days', progress: 65, color: 'from-blue-100 to-blue-300' },
  { id: 2, title: 'Calculus II', code: 'MATH201', milestone: 'Quiz on Friday', progress: 40, color: 'from-blue-100 to-blue-300' },
  { id: 3, title: 'Physics: Mechanics', code: 'PHYS101', milestone: 'Lab Report Due', progress: 80, color: 'from-blue-100 to-blue-300' },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10 pb-12">
      
      {/* Dashboard Header Title */}
      <div className="mb-2 px-2">
        <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white">Ofek's Main Dashboard</h1>
      </div>

      {/* 1. Hero Section: Semester Progress (Minimized) */}
      <section className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-100 dark:bg-[#111] dark:ring-white/5 shrink-0">
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Spring Semester
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                {SEMESTER_PROGRESS}
              </span>
              <span className="text-sm font-bold text-gray-400">%</span>
            </div>
          </div>
          
          {/* Progress Bar Container */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100/80 dark:bg-gray-800/80">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-in-out relative overflow-hidden"
              style={{ width: `${SEMESTER_PROGRESS}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Next Task" Queue */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            Next Task Queue
          </h2>
          <button className="group flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            View all
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="m9 18 6-6-6-6"></path></svg>
          </button>
        </div>
        
        {/* Horizontal Scrollable Task List with invisible scrollbar padding */}
        <div className="flex gap-5 overflow-x-auto pb-6 pt-2 px-2 -mx-2 snap-x snap-mandatory scrollbar-hide">
          {TASKS.map((task) => (
            <div 
              key={task.id}
              className="group relative flex w-[300px] shrink-0 snap-start flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:border-white/5 dark:bg-[#151515] dark:hover:border-blue-500/30 dark:hover:bg-[#1a1a1a]"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                  task.priority === 'high' ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20' :
                  task.priority === 'medium' ? 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' :
                  'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                }`}>
                  {task.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {task.time}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 dark:text-white mt-2">
                {task.title}
              </h3>
              
              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:hover:shadow-white/20">
                  <span>Start Task</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Course Overview Grid */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            Course Overview
          </h2>
          <button className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Course
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <div 
              key={course.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-white/5 dark:bg-[#151515]"
            >
              {/* Card Header with gradient */}
              <div className={`h-2.5 w-full bg-gradient-to-r ${course.color}`}></div>
              
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight dark:text-white">
                      {course.code}
                    </h3>
                    <p className="mt-1.5 text-sm font-medium text-gray-500 line-clamp-1 dark:text-gray-400">
                      {course.title}
                    </p>
                  </div>
                  <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors dark:hover:bg-white/10 dark:hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                  </button>
                </div>

                <div className="mt-8 flex items-center gap-3.5 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-black dark:shadow-none border border-gray-100 dark:border-white/10 text-indigo-600 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">Next Milestone</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{course.milestone}</p>
                  </div>
                </div>

                {/* Course Actions */}
                <div className="mt-7 flex items-center gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200 active:scale-[0.98] dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                    Analytics
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]">
                    Practice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
