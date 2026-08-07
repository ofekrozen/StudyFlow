"use client";

import { useState } from "react";
import type { CourseSubject } from "@/lib/types";
import Select from "@/components/ui/Select";

type Subject = Pick<CourseSubject, "subject_id" | "subject_name" | "subject_description">;

interface SocraticTabProps {
  subjects: Subject[];
  enrollmentId: string;
}

type SessionState = "idle" | "questioning" | "feedback";

interface Feedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Adaptive session, hard-capped server-side. Used only for progress display.
const MAX_QUESTIONS = 5;

export default function SocraticTab({ subjects, enrollmentId }: SocraticTabProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.subject_id ?? "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/socratic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: enrollmentId, subject_id: selectedSubjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start session");

      setSessionId(data.session_id);
      setQuestion(data.question);
      setQuestionIndex(0);
      setAnswer("");
      setHintText(null);
      setHintUsed(false);
      setFeedback(null);
      setSessionState("questioning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/socratic/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer_text: answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit answer");

      if (data.action === "COMPLETE") {
        setFeedback({
          score: data.score,
          strengths: data.feedback?.strengths ?? [],
          weaknesses: data.feedback?.weaknesses ?? [],
          recommendations: data.feedback?.recommendations ?? [],
        });
        setSessionState("feedback");
      } else {
        setQuestion(data.next_question);
        setQuestionIndex(data.question_index);
        setAnswer("");
        setHintText(null);
        setHintUsed(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  }

  async function getHint() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/socratic/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question_index: questionIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get hint");

      setHintText(data.hint_text);
      setHintUsed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get hint");
    } finally {
      setLoading(false);
    }
  }

  function resetSession() {
    setSessionState("idle");
    setSessionId(null);
    setQuestion("");
    setQuestionIndex(0);
    setAnswer("");
    setHintText(null);
    setHintUsed(false);
    setFeedback(null);
    setError(null);
  }

  const displayNumber = Math.min(questionIndex + 1, MAX_QUESTIONS);

  return (
    <div className="flex flex-col gap-6">
      {/* Info banner above card */}
      {sessionState === "idle" && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-4 py-3">
          <div className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            The Socratic Practitioner will ask you <strong>up to {MAX_QUESTIONS} guided questions</strong> on a topic of your choice, grounded in your course material and tailored to what you&apos;ve struggled with before. Your accuracy score personalizes future sessions.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-3">
          <div className="mt-0.5 text-red-600 dark:text-red-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
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
            disabled={sessionState === "questioning" || loading}
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
                  You&apos;ll be asked <strong className="text-gray-700 dark:text-gray-300">up to {MAX_QUESTIONS} questions</strong> on <strong className="text-gray-700 dark:text-gray-300">{selectedSubject.subject_name}</strong>. Answer each in your own words.
                </p>
              )}
            </div>
            <button
              onClick={startSession}
              disabled={!selectedSubjectId || subjects.length === 0 || loading}
              className="mt-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Thinking..." : "Start Session"}
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
                  Question {displayNumber} of up to {MAX_QUESTIONS}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {selectedSubject?.subject_name}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(Math.min(questionIndex, MAX_QUESTIONS) / MAX_QUESTIONS) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {displayNumber}
                </div>
                <p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-white">
                  {question}
                </p>
              </div>
            </div>

            {/* Hint callout */}
            {hintText && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-4 py-3">
                <div className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-300">{hintText}</p>
              </div>
            )}

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
                disabled={loading}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors disabled:opacity-60"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={getHint}
                disabled={hintUsed || loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>
                {hintUsed ? "Hint used" : "Hint"}
              </button>
              <button
                onClick={submitAnswer}
                disabled={!answer.trim() || loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-black transition-all hover:bg-black dark:hover:bg-gray-100 hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Thinking..."
                ) : (
                  <>Submit Answer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── FEEDBACK STATE ── */}
        {sessionState === "feedback" && feedback && (
          <div className="flex flex-col gap-6">
            {/* Score */}
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Accuracy Score</p>
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {feedback.score}%
              </div>
            </div>

            {/* Recommendations */}
            {feedback.recommendations.length > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Personalized Feedback</h4>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feedback.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strength / Weakness chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">Strengths</p>
                <ul className="flex flex-col gap-1 text-sm text-emerald-800 dark:text-emerald-300">
                  {feedback.strengths.length > 0 ? (
                    feedback.strengths.map((s, i) => <li key={i}>✓ {s}</li>)
                  ) : (
                    <li className="opacity-60">None identified</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400 mb-2">To Improve</p>
                <ul className="flex flex-col gap-1 text-sm text-red-800 dark:text-red-300">
                  {feedback.weaknesses.length > 0 ? (
                    feedback.weaknesses.map((w, i) => <li key={i}>✗ {w}</li>)
                  ) : (
                    <li className="opacity-60">None identified</li>
                  )}
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
