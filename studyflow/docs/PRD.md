# Product Requirements Document (PRD): StudyFlow

## 1. Product Overview

**Name:** StudyFlow
**Core Concept:** An automated, AI-powered study platform that transitions students from passive reading to active recall using spaced repetition.
**Mechanic:** Users upload their course syllabi and weekly notes. The system automatically processes these documents and orchestrates a daily queue of micro-learning tasks (flashcards, short quizzes) and provides Socratic, AI-driven feedback to identify knowledge gaps.

## 2. System Architecture & Stack

- **Frontend:** Next.js (React-based, component-driven UI).
- **Backend/Database:** Relational database handling users, courses, and pending tasks.
- **Orchestration/Automation:** n8n (or similar webhook-based engine) for cron jobs, document parsing pipelines, and scheduling background tasks.
- **AI Integration:** LLM for Retrieval-Augmented Generation (RAG) to generate quizzes from specific syllabus contexts and act as a conversational tutor for grading.

## 3. Core User Flow (Spaced Repetition Model)

1. **Setup:** User registers, creates a course, uploads the syllabus, and defines weekly lecture schedules and exam dates.
2. **Trigger:** Automation engine uses the schedule to prompt the user to upload weekly lecture notes.
3. **Processing:** Notes are parsed, embedded, and sent to the LLM to generate bite-sized active recall challenges.
4. **Execution:** User logs in daily to clear their dynamically generated "Next Task" queue.
5. **Feedback Loop:** AI evaluates answers, provides targeted corrections, and schedules misunderstood concepts for more frequent review.

---

## 4. UI Components & Screen Architecture

### 4.1 Onboarding & Setup

- **Goal:** Capture user data, course parameters, and automation triggers.
- **Components:**
- Auth Wrapper (Email/Password, OAuth).
- Step 1: Course Basics (Name, Semester Start Date, Semester End Date).
- Step 2: Syllabus Upload (Drag-and-drop file zone).
- Step 3: Schedule Builder (Final Exam Date, Weekly Lecture Days & Times).

### 4.2 Main Dashboard

- **Goal:** Central command center driving daily micro-learning engagement.
- **Components:**
- Global Nav (Profile, Notifications).
- Hero Section: Semester Progress Bar (Calculated via current date vs. semester start/end).
- "Next Task" Queue: Unified, prioritized horizontal list of actionable tasks (e.g., "Upload Notes", "Daily Review"). Includes a primary "Start" action.
- Course Overview Grid: Cards displaying Course Title, Next Milestone (countdown), "Practice" button, "Analytics" button, and a 3-dot management menu.

### 4.3 Course Hub (Analytics & File Management) _(Pending Detailed Definition)_

- **Goal:** The filing cabinet and performance tracker for a specific course.
- **Expected Components:** Strengths/Weaknesses radar chart, file upload interface for ongoing notes, historical log of past assessments.

### 4.4 Practice Arena (Focus Mode) _(Pending Detailed Definition)_

- **Goal:** Distraction-free testing and feedback environment.
- **Expected Components:** Clean assessment UI (flashcards, text inputs), conversational AI tutor interface for immediate grading and Socratic feedback.

---

## 5. Data Models (Database Schema)

- **Users Table:**
- `user_id` (UUID, Primary Key)
- `email` (String)
- `created_at` (Timestamp)

- **Courses Table:**
- `course_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `course_name` (String)
- `semester_start` (Date)
- `semester_end` (Date)
- `exam_date` (Date)

- **Syllabus Table:**
- `syllabus_id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `file_url` (String)
- `parsed_text` (Text - for RAG context)

- **Lecture_Schedule Table:**
- `schedule_id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `day_of_week` (Integer 1-7)
- `start_time` (Time)
- `end_time` (Time)

- **Pending_Tasks Table:**
- `task_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `course_id` (UUID, Foreign Key)
- `task_type` (Enum: 'upload_notes', 'daily_review', 'concept_check')
- `due_date` (Timestamp)
- `status` (Enum: 'pending', 'completed')

## 6. Automation & AI Logic Requirements

- **Task Generation:** The system must actively generate `Pending_Tasks` rows based on the `Lecture_Schedule` (e.g., creating an 'upload_notes' task 2 hours after `end_time`).
- **RAG Boundaries:** The LLM must be strictly grounded in the `parsed_text` of the specific course's syllabus and uploaded notes to prevent hallucinations in generated quizzes.
- **Agent Persona:** The grading AI must function as a Socratic tutor, prioritizing guiding questions and methodology over simply providing the correct answer.
