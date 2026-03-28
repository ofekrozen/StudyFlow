# StudyFlow — CLAUDE.md

This file provides context, architecture, and conventions for AI-assisted development of the StudyFlow project.

---

## Project Overview

**StudyFlow** is an AI-powered learning platform for engineering students. It focuses on deep understanding, spaced repetition, and gamification to support effective semester-long learning and exam preparation.

### Business Model

| Plan | Limitation               |
| ---- | ------------------------ |
| Free | Up to 2 active courses   |
| Pro  | Unlimited active courses |

---

## Tech Stack

| Layer               | Technology                                  |
| ------------------- | ------------------------------------------- |
| Fullstack Framework | Next.js (App Router)                        |
| Frontend            | React + Tailwind CSS                        |
| Backend             | Next.js API Routes (Serverless)             |
| Database            | Supabase (PostgreSQL + pgvector)            |
| AI / LLM            | OpenAI API / Anthropic + LangChain.js + n8n |
| File Storage        | Supabase Storage (PDFs)                     |
| Vector Search       | pgvector (for RAG & Embeddings)             |

---

## Core Features

### 1. Main Dashboard

- **Gamification bar**: semester progress % + login streak counter
- **Task list**: 3–5 highest-priority tasks, quick-add support
  - `🧠 Review/Practice` — Socratic tutor sessions (min. weekly per topic)
  - `📒 Assignments` — Submission deadline tracking
  - `🎓 Exam Prep` — Time-appropriate exam preparation tasks
- **Course cards**: each shows course name, battery-style retention indicator (red/yellow/green), and buttons to Practice or Analyze

### 2. Course Practice Page

- **Socratic Tutor**: up to 5 guided questions per topic → feedback + corrections → personalized future questions
- **Homework Upload**: student uploads work → AI evaluates accuracy → suggests improvements
- **Practice Mode**: full solutions to topic questions; exam-style questions from uploaded past exams

### 3. Course Analysis Page

- Visual progress tracking per course

### 4. Schedule & Task Management (LMS)

- Enter exam/quiz/assignment dates
- Enter lecture/tutorial schedule
- System detects upcoming lectures and sends "warm-up" reminders based on prior material

### 5. Gamification & Mastery Tracker

- **Knowledge Nodes**: course broken into atomic topics
- **Ebbinghaus Decay Curve**: retention score decays from 100% → 10% over 7 days without practice; resets on practice
- **Daily Streak**: encourages daily logins

---

## Database Schema

### User Management & Subscriptions

```sql
Users (user_id PK, institution_id FK, email, phone_number, auth_provider,
       streak_count, last_login, created_at, updated_at, deleted_at)

Subscriptions (subscription_id PK, user_id FK, plan ENUM['free','pro'],
               end_date, created_at, updated_at, deleted_at)
```

### Academic Infrastructure

```sql
Institutions (institution_id PK, institution_name)

Professors (professor_id PK, institution_id FK, professor_name)

Semesters (semester_id PK, institution_id FK, semester_name,
           semester_start, semester_end, is_active BOOL)
```

### Course Management

```sql
Courses (course_id PK, institution_id FK, semester_id FK, syllabus_id FK,
         course_name, exam_date, created_at, updated_at, deleted_at)

Course_Enrollment (enrollment_id PK, user_id FK, course_id FK,
                   professor_id FK, is_active BOOL,
                   created_at, updated_at, deleted_at)
```

### Materials & RAG (Knowledge Base)

```sql
User_Course_Materials (user_course_material_id PK, enrollment_id FK,
                       material_type_id FK, pdf_url, parsed_text,
                       created_at, updated_at, deleted_at)

Syllabus (syllabus_id PK, course_id FK, file_url, parsed_text)

Course_Professor_Exams (course_professor_exam_id PK, course_professor_id FK,
                        exam_name, exam_year_moed, file_url, parsed_text)
```

### Learning & AI (Socratic Tutor)

```sql
Socratic_Tutor_Sessions (session_id PK, enrollment_id FK, subject_id FK,
                          session_date,
                          ai_questions JSONB, user_answers JSONB, ai_feedback JSONB,
                          ai_score INT,
                          weak_points JSONB DEFAULT '[]',
                          hints_given INT DEFAULT 0,
                          questions_count INT DEFAULT 5,
                          session_status ENUM['pending','in_progress','completed'])

Subject_Mastery (mastery_id PK, enrollment_id FK, subject_id FK,
                 mastery_score INT DEFAULT 0 CHECK(0–100),
                 decay_rate FLOAT DEFAULT 0.230,
                 last_practiced_at TIMESTAMPTZ, next_review_at TIMESTAMPTZ,
                 UNIQUE(enrollment_id, subject_id))
-- Indexes: idx_subject_mastery_enrollment (enrollment_id),
--          idx_subject_mastery_review (next_review_at) WHERE NOT NULL

Pending_Tasks (task_id PK, enrollment_id FK,
               task_type ENUM['upload_notes','daily_review','concept_check'],
               due_date, status ENUM['pending','completed'])
```

---

## Design System

- **Style**: Minimalist, airy, spacious
- **Color Palette** ("Focus & Clarity"):
  - Deep Blue (primary)
  - White-Gray (background / neutral)
  - Turquoise (accent / interactive)
- **Retention Battery Colors**: 🔴 Red (<40%) | 🟡 Yellow (40–70%) | 🟢 Green (>70%)

---

## AI / RAG Architecture Notes

- PDFs (lectures, syllabi, past exams) are uploaded to **Supabase Storage**
- Parsed text is stored in the `parsed_text` column of each materials table
- Embeddings are stored via **pgvector** for semantic similarity search
- The **Socratic Tutor** uses RAG over the student's enrolled course materials
- **LangChain.js** orchestrates multi-step AI chains
- **n8n** handles automation workflows (e.g., warm-up notifications, task scheduling)

---

## Key Conventions

- All IDs are **UUID** type
- Soft deletes via `deleted_at` timestamp (never hard-delete user or course records)
- `is_active` flags on `Semesters` and `Course_Enrollment` for current state
- `session_status` and `task_type` use **Enums** — add new values via migration only
- AI responses must always be grounded in the student's own uploaded materials (RAG-first)
- The Socratic Tutor must never give away answers directly — guide through questions only

---

## Development Priorities

1. Auth + Supabase setup (users, subscriptions)
2. Course enrollment + material upload pipeline
3. RAG ingestion (PDF parsing → embedding → pgvector)
4. Socratic Tutor session flow
5. Ebbinghaus decay tracker + gamification
6. Dashboard + task management UI
7. Schedule/LMS + notification system
