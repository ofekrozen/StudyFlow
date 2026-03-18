"use client";

import { useState } from "react";
import type { CourseSubject } from "@/lib/types";
import Select from "@/components/ui/Select";

type Subject = Pick<CourseSubject, "subject_id" | "subject_name" | "subject_description">;

interface SocraticTabProps {
  subjects: Subject[];
}

type SessionState = "idle" | "questioning" | "feedback";

const TOTAL_QUESTIONS = 5;

const PLACEHOLDER_QUESTIONS = [
  "How would you describe the core principle of this topic in your own words? What makes it distinct from related concepts you've studied?",
  "Can you walk through a concrete example that demonstrates this concept in practice? What are the key steps involved?",
  "What are the most common misconceptions students have about this topic, and why do those misunderstandings arise?",
  "How does this concept connect to other topics in the course? Can you identify at least two meaningful relationships?",
  "If you had to explain this topic to someone with no background in the subject, what analogy or comparison would you use?",
];

export default function SocraticTab({ subjects }: SocraticTabProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.subject_id ?? "");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  function startSession() {
    setSessionState("questioning");
    setCurrentQuestion(1);
    setAnswers([]);
    setAnswer("");
  }

  function handleNext() {
    const updated = [...answers, answer];
    setAnswers(updated);
    setAnswer("");

    if (currentQuestion < TOTAL_QUESTIONS) {
      setCurrentQuestion((q) => q + 1);
    } else {
      setSessionState("feedback");
    }
  }

  function resetSession() {
    setSessionState("idle");
    setCurrentQuestion(1);
    setAnswer("");
    setAnswers([]);
  }

  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  return (
    <div className="flex flex-col gap-6">
      {/* Info banner above card */}
      {sessionState === "idle" && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-4 py-3">
          <div className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            The Socratic Practitioner will ask you <strong>5 guided questions</strong> on a topic of your choice, designed to reveal and deepen your understanding. Your accuracy score will personalize future sessions.
          </p>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100 dark:bg-[#151515] dark:border-white/5 dark:ring-white/5 p-6 sm:p-8 flex flex-col gap-6">

        {/* Topic Selector */}
        {subjects.length > 0 ? (
          <Select
            id="socratic-topic"
            label="Select Topic"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={sessionState === "questioning"}
          >
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </Select>
        ) : (
          <div className="rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            No topics found for this course.
          </div>
        )}

        {/* ── IDLE STATE ── */}
        {sessionState === "idle" && (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line><circle cx="12" cy="12" r="10"></circle></svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ready to practice?</h3>
              {selectedSubject && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  You&apos;ll be asked <strong className="text-gray-700 dark:text-gray-300">{TOTAL_QUESTIONS} questions</strong> on <strong className="text-gray-700 dark:text-gray-300">{selectedSubject.subject_name}</strong>. Answer each in your own words.
                </p>
              )}
            </div>
            <button
              onClick={startSession}
              disabled={!selectedSubjectId || subjects.length === 0}
              className="mt-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Session
            </button>
          </div>
        )}

        {/* ── QUESTIONING STATE ── */}
        {sessionState === "questioning" && (
          <div className="flex flex-col gap-5">
            {/* Progress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Question {currentQuestion} of {TOTAL_QUESTIONS}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {selectedSubject?.subject_name}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${((currentQuestion - 1) / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {currentQuestion}
                </div>
                <p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-white">
                  {PLACEHOLDER_QUESTIONS[currentQuestion - 1]}
                </p>
              </div>
            </div>

            {/* Answer Area */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleNext}
              disabled={!answer.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-black transition-all hover:bg-black dark:hover:bg-gray-100 hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {currentQuestion < TOTAL_QUESTIONS ? (
                <>Next Question <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></>
              ) : (
                <>Submit Answers <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></>
              )}
            </button>
          </div>
        )}

        {/* ── FEEDBACK STATE ── */}
        {sessionState === "feedback" && (
          <div className="flex flex-col gap-6">
            {/* Score */}
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Accuracy Score</p>
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                78%
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Good effort! Your answers showed solid foundational understanding with room to strengthen depth.
              </p>
            </div>

            {/* Feedback Summary */}
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">Personalized Feedback</h4>
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>Your responses demonstrated a basic grasp of the core concepts. You correctly identified the main mechanism in questions 1 and 3.</p>
                <p>To improve, focus on <strong className="text-gray-800 dark:text-gray-200">concrete examples</strong> and <strong className="text-gray-800 dark:text-gray-200">cross-topic connections</strong> — areas where your answers were more surface-level.</p>
                <p>Next session, try elaborating on the "why" behind each concept for a higher accuracy score.</p>
              </div>
            </div>

            {/* Strength / Weakness chips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Strengths</p>
                <ul className="flex flex-col gap-1 text-sm text-emerald-800 dark:text-emerald-300">
                  <li>✓ Core definitions</li>
                  <li>✓ Mechanism description</li>
                </ul>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400 mb-2">To Improve</p>
                <ul className="flex flex-col gap-1 text-sm text-red-800 dark:text-red-300">
                  <li>✗ Concrete examples</li>
                  <li>✗ Cross-topic links</li>
                </ul>
              </div>
            </div>

            <button
              onClick={resetSession}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.46"></path></svg>
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
