"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourseSubject } from "@/lib/types";
import SocraticTab from "./SocraticTab";
import HomeworkTab from "./HomeworkTab";
import PracticeQuestionsTab from "./PracticeQuestionsTab";

type Subject = Pick<CourseSubject, "subject_id" | "subject_name" | "subject_description">;

interface PracticeClientProps {
  enrollmentId: string;
  courseName: string;
  subjects: Subject[];
  hasExams: boolean;
}

type ActiveTab = "socratic" | "homework" | "questions";

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "socratic",
    label: "Socratic Practitioner",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    ),
  },
  {
    id: "homework",
    label: "Homework Upload",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    ),
  },
  {
    id: "questions",
    label: "Practice Questions",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    ),
  },
];

export default function PracticeClient({ enrollmentId, courseName, subjects, hasExams }: PracticeClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("socratic");

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 px-2">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
          All Courses
        </Link>
        <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white">
          {courseName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose a practice mode below to deepen your understanding.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200 dark:border-white/10 px-2">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold transition-colors
                ${activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-blue-600 dark:after:bg-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-0">
        {activeTab === "socratic" && <SocraticTab subjects={subjects} />}
        {activeTab === "homework" && <HomeworkTab />}
        {activeTab === "questions" && <PracticeQuestionsTab subjects={subjects} hasExams={hasExams} />}
      </div>
    </div>
  );
}
