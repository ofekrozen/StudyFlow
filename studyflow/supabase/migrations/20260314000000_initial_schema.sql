-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- INSTITUTIONS
-- ============================================================
CREATE TABLE institutions (
  institution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_name TEXT NOT NULL
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(institution_id),
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  auth_provider TEXT,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- PROFESSORS
-- ============================================================
CREATE TABLE professors (
  professor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  professor_name TEXT NOT NULL
);

-- ============================================================
-- SEMESTERS
-- ============================================================
CREATE TABLE semesters (
  semester_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  semester_name TEXT NOT NULL,
  semester_start DATE NOT NULL,
  semester_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(institution_id),
  course_name TEXT NOT NULL,
  semester_id UUID NOT NULL REFERENCES semesters(semester_id),
  syllabus_id UUID, -- FK added after syllabus table
  exam_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- SYLLABUS
-- ============================================================
CREATE TABLE syllabus (
  syllabus_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  file_url TEXT,
  parsed_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Back-fill the FK from courses -> syllabus
ALTER TABLE courses
  ADD CONSTRAINT courses_syllabus_id_fkey
  FOREIGN KEY (syllabus_id) REFERENCES syllabus(syllabus_id);

-- ============================================================
-- COURSE_ENROLLMENT
-- ============================================================
CREATE TABLE course_enrollment (
  enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  professor_id UUID NOT NULL REFERENCES professors(professor_id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- MATERIAL_TYPES
-- ============================================================
CREATE TABLE material_types (
  material_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_type_name TEXT NOT NULL
);

-- ============================================================
-- USER_COURSE_MATERIALS
-- ============================================================
CREATE TABLE user_course_materials (
  user_course_material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollment(enrollment_id),
  material_type_id UUID NOT NULL REFERENCES material_types(material_type_id),
  pdf_url TEXT,
  parsed_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- COURSE_PROFESSORS
-- ============================================================
CREATE TABLE course_professors (
  course_professor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  professor_id UUID NOT NULL REFERENCES professors(professor_id)
);

-- ============================================================
-- COURSE_PROFESSOR_EXAMS
-- ============================================================
CREATE TABLE course_professor_exams (
  course_professor_exam_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_professor_id UUID NOT NULL REFERENCES course_professors(course_professor_id),
  exam_name TEXT NOT NULL,
  exam_year_moed TEXT,
  file_url TEXT,
  parsed_text TEXT
);

-- ============================================================
-- LECTURE_SCHEDULE
-- ============================================================
CREATE TABLE lecture_schedule (
  lecture_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollment(enrollment_id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- ============================================================
-- LECTURE_ENROLLMENT
-- ============================================================
CREATE TABLE lecture_enrollment (
  lecture_enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollment(enrollment_id),
  lecture_id UUID NOT NULL REFERENCES lecture_schedule(lecture_id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- PENDING_TASKS
-- ============================================================
CREATE TYPE task_type_enum AS ENUM ('upload_notes', 'daily_review', 'concept_check');
CREATE TYPE task_status_enum AS ENUM ('pending', 'completed');

CREATE TABLE pending_tasks (
  task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollment(enrollment_id),
  task_type task_type_enum NOT NULL,
  due_date TIMESTAMPTZ,
  status task_status_enum NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- COURSE_SUBJECTS
-- ============================================================
CREATE TABLE course_subjects (
  subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  subject_name TEXT NOT NULL,
  subject_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- SOCRATIC_TUTOR_SESSIONS
-- ============================================================
CREATE TYPE session_status_enum AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE socratic_tutor_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollment(enrollment_id),
  subject_id UUID NOT NULL REFERENCES course_subjects(subject_id),
  session_date TIMESTAMPTZ,
  ai_questions TEXT,
  user_answers TEXT,
  ai_feedback TEXT,
  ai_score INTEGER,
  session_status session_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TYPE subscription_plan_enum AS ENUM ('free', 'pro');

CREATE TABLE subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  plan subscription_plan_enum NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  end_date TIMESTAMPTZ
);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update on row modification)
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'courses',
    'course_enrollment',
    'user_course_materials',
    'syllabus',
    'course_subjects',
    'socratic_tutor_sessions',
    'subscriptions'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (enable on user-scoped tables)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE socratic_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_enrollment ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "users: own row" ON users
  USING (user_id = auth.uid());

-- Enrollments scoped to the owning user
CREATE POLICY "enrollment: own" ON course_enrollment
  USING (user_id = auth.uid());

-- Materials scoped via enrollment
CREATE POLICY "materials: own" ON user_course_materials
  USING (
    enrollment_id IN (
      SELECT enrollment_id FROM course_enrollment WHERE user_id = auth.uid()
    )
  );

-- Tasks scoped via enrollment
CREATE POLICY "tasks: own" ON pending_tasks
  USING (
    enrollment_id IN (
      SELECT enrollment_id FROM course_enrollment WHERE user_id = auth.uid()
    )
  );

-- Tutor sessions scoped via enrollment
CREATE POLICY "tutor_sessions: own" ON socratic_tutor_sessions
  USING (
    enrollment_id IN (
      SELECT enrollment_id FROM course_enrollment WHERE user_id = auth.uid()
    )
  );

-- Subscriptions scoped to owning user
CREATE POLICY "subscriptions: own" ON subscriptions
  USING (user_id = auth.uid());

-- Lecture enrollment scoped via enrollment
CREATE POLICY "lecture_enrollment: own" ON lecture_enrollment
  USING (
    enrollment_id IN (
      SELECT enrollment_id FROM course_enrollment WHERE user_id = auth.uid()
    )
  );
