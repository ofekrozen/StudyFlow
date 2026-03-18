"use client";

import { useState } from "react";
import type { CourseSubject } from "@/lib/types";
import Select from "@/components/ui/Select";

type Subject = Pick<CourseSubject, "subject_id" | "subject_name" | "subject_description">;

interface PracticeQuestionsTabProps {
  subjects: Subject[];
  hasExams: boolean;
}

type SubTab = "topic" | "exam";

const PLACEHOLDER_TOPIC_QUESTIONS = [
  {
    question:
      "Describe the primary mechanism that governs this concept. What are the necessary and sufficient conditions for it to apply?",
    solution:
      "The mechanism involves three interdependent stages: initialization, propagation, and termination. The necessary conditions are (1) an active input signal and (2) a valid state transition. The sufficient condition is that both hold simultaneously. For example, in a finite automaton, a state transition fires when the current state and input symbol together match a transition rule in the transition function δ.",
  },
  {
    question:
      "Given a concrete scenario from this topic, trace through the step-by-step process and identify where errors could arise.",
    solution:
      "Step 1: Identify the initial state and input. Step 2: Apply the transition rules iteratively. Step 3: Check the acceptance condition. Errors most commonly arise at step 2 when ambiguous transitions are present, or at step 3 when the acceptance set is not properly defined. Example: in a DFA simulation, forgetting to handle the dead state leads to undefined behavior on rejected inputs.",
  },
  {
    question:
      "Compare and contrast two approaches to solving a core problem in this topic. Under what conditions is each approach preferable?",
    solution:
      "Approach A (direct construction) is preferable when the problem size is small and the structure is known in advance — it offers O(n) time complexity and minimal overhead. Approach B (reduction) is preferable for larger, unknown structures since it leverages existing proofs and guarantees correctness by construction. The crossover point depends on the reduction overhead, typically around n = 1000 in practice.",
  },
];

const PLACEHOLDER_EXAM_QUESTIONS = [
  {
    question:
      "Prove or disprove the following claim: for every regular language L, the complement of L is also regular. Justify your answer formally.",
    solution:
      "Claim is TRUE. Proof: Let M = (Q, Σ, δ, q₀, F) be a DFA accepting L. Construct M′ = (Q, Σ, δ, q₀, Q \\ F) by swapping accepting and non-accepting states. M′ accepts exactly those strings rejected by M, i.e., the complement of L. Since M′ is a valid DFA, its language is regular. ∎",
  },
  {
    question:
      "Design an algorithm that solves the following problem in O(n log n) time. Provide pseudocode and a correctness argument.",
    solution:
      "Algorithm:\n1. Sort the input array A in ascending order — O(n log n).\n2. Use two pointers i = 0, j = n−1; while i < j: check A[i] + A[j] against target.\n   - If equal: record pair, advance both pointers.\n   - If less: increment i.\n   - If greater: decrement j.\n3. Return all recorded pairs.\nCorrectness: sorting preserves all elements; two-pointer correctly enumerates all pairs summing to target in O(n) after sorting.",
  },
  {
    question:
      "A student claims the following solution is correct. Identify the error(s) and provide a corrected version.",
    solution:
      "Error 1: The loop bound should be n−1, not n, to avoid an off-by-one access. Error 2: The base case returns 0 instead of 1 for an empty set — this causes incorrect accumulation. Corrected version: change loop bound to `i < n−1` and base case to `return 1`. This ensures the recurrence resolves correctly and the algorithm returns the expected result for all valid inputs.",
  },
];

export default function PracticeQuestionsTab({ subjects, hasExams }: PracticeQuestionsTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("topic");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.subject_id ?? "");
  const [revealedSolutions, setRevealedSolutions] = useState<Set<number>>(new Set());

  function toggleSolution(index: number) {
    setRevealedSolutions((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function handleSubjectChange(id: string) {
    setSelectedSubjectId(id);
    setRevealedSolutions(new Set());
  }

  const questions = subTab === "topic" ? PLACEHOLDER_TOPIC_QUESTIONS : PLACEHOLDER_EXAM_QUESTIONS;

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Tab Bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
        {(["topic", "exam"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setSubTab(t); setRevealedSolutions(new Set()); }}
            className={`relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold transition-colors
              ${subTab === t
                ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-blue-600 dark:after:bg-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
          >
            {t === "topic" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                Topic Questions
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                Exam Style
              </>
            )}
          </button>
        ))}
      </div>

      {/* Topic Questions Sub-Tab */}
      {subTab === "topic" && (
        <div className="flex flex-col gap-5">
          {subjects.length > 0 && (
            <Select
              id="practice-topic"
              label="Select Topic"
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100 dark:bg-[#151515] dark:border-white/5 dark:ring-white/5 p-5 sm:p-6 flex flex-col gap-4"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-white">
                      {q.question}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/10 dark:ring-blue-500/20">
                    Practice
                  </span>
                </div>

                {/* Toggle Solution */}
                <button
                  onClick={() => toggleSolution(i)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-fit"
                >
                  {revealedSolutions.has(i) ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      Hide Solution
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Show Solution
                    </>
                  )}
                </button>

                {/* Solution */}
                {revealedSolutions.has(i) && (
                  <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Solution</span>
                    </div>
                    <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-200 whitespace-pre-line">
                      {q.solution}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Style Sub-Tab */}
      {subTab === "exam" && (
        <div className="flex flex-col gap-5">
          {!hasExams ? (
            <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] p-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No past exams uploaded</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Upload past exams from your professor to enable exam-style questions tailored to their testing style.
                </p>
              </div>
              <button className="mt-1 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Upload Past Exam
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {PLACEHOLDER_EXAM_QUESTIONS.map((q, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100 dark:bg-[#151515] dark:border-white/5 dark:ring-white/5 p-5 sm:p-6 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-white">
                        {q.question}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/10 dark:ring-indigo-500/20">
                      Exam Style
                    </span>
                  </div>

                  <button
                    onClick={() => toggleSolution(i + 100)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-fit"
                  >
                    {revealedSolutions.has(i + 100) ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        Hide Solution
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Show Solution
                      </>
                    )}
                  </button>

                  {revealedSolutions.has(i + 100) && (
                    <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Solution</span>
                      </div>
                      <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-200 whitespace-pre-line">
                        {q.solution}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
