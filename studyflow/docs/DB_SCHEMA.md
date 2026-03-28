## Database Schema

- **Users Table:**
- `user_id` (UUID, Primary Key)
- `institution_id` (UUID, Foreign Key)
- `email` (String)
- `phone_number` (String)
- `auth_provider` (String)
- `streak_count` (Integer)
- `last_login` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Institutions Table:**
- `institution_id` (UUID, Primary Key)
- `institution_name` (String)

- **Professors Table:**
- `professor_id` (UUID, Primary Key)
- `institution_id` (UUID, Foreign Key)
- `professor_name` (String)

- **Semesters Table:**
- `semester_id` (UUID, Primary Key)
- `institution_id` (UUID, Foreign Key)
- `semester_name` (String)
- `semester_start` (Date)
- `semester_end` (Date)
- `is_active` (Boolean)

- **Courses Table:**
- `course_id` (UUID, Primary Key)
- `institution_id` (UUID, Foreign Key)
- `course_name` (String)
- `semester_id` (UUID, Foreign Key)
- `syllabus_id` (UUID, Foreign Key)
- `exam_date` (Date)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Course_Enrollment Table:**
- `enrollment_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `course_id` (UUID, Foreign Key)
- `professor_id` (UUID, Foreign Key)
- `is_active` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **User_Course_Materials Table:**
- `user_course_material_id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key)
- `material_type_id` (UUID, Foreign Key)
- `pdf_url` (String)
- `parsed_text` (Text - for RAG context)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Material_Types Table:**
- `material_type_id` (UUID, Primary Key)
- `material_type_name` (String)

- **Course_Professors Table:**
- `course_professor_id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `professor_id` (UUID, Foreign Key)

- **Course_Professor_Exams Table:**
- `course_professor_exam_id` (UUID, Primary Key)
- `course_professor_id` (UUID, Foreign Key)
- `exam_name` (String)
- `exam_year_moed` (String)
- `file_url` (String)
- `parsed_text` (Text - for RAG context)

- **Syllabus Table:**
- `syllabus_id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `file_url` (String)
- `parsed_text` (Text - for RAG context)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Lecture_Schedule Table:**
- `lecture_id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key)
- `day_of_week` (Integer 1-7)
- `start_time` (Time)
- `end_time` (Time)

- **Lecture_Enrollment Table:**
- `lecture_enrollment_id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key)
- `lecture_id` (UUID, Foreign Key)
- `is_active` (Boolean)

- **Pending_Tasks Table:**
- `task_id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key)
- `task_type` (Enum: 'upload_notes', 'daily_review', 'concept_check')
- `due_date` (Timestamp)
- `status` (Enum: 'pending', 'completed')
- `is_active` (Boolean)

- **Course_Subjects Table:**
- `subject_id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `subject_name` (String)
- `subject_description` (String)
- `is_active` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Socratic_Tutor_Sessions Table:**
- `session_id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key)
- `subject_id` (UUID, Foreign Key)
- `session_date` (Timestamp)
- `ai_questions` (JSONB)
- `user_answers` (JSONB)
- `ai_feedback` (JSONB)
- `ai_score` (Integer)
- `weak_points` (JSONB, Default: [])
- `hints_given` (Integer, Default: 0)
- `questions_count` (Integer, Default: 5)
- `session_status` (Enum: 'pending', 'in_progress', 'completed')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Subject_Mastery Table:**
- `mastery_id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key)
- `subject_id` (UUID, Foreign Key)
- `mastery_score` (Integer, Default: 0, CHECK 0–100)
- `decay_rate` (Float, Default: 0.230)
- `last_practiced_at` (Timestamp)
- `next_review_at` (Timestamp)
- UNIQUE(enrollment_id, subject_id)
- Indexes: `idx_subject_mastery_enrollment` on enrollment_id; `idx_subject_mastery_review` on next_review_at WHERE NOT NULL

- **Subscriptions Table:**
- `subscription_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `plan` (Enum: 'free', 'pro')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)
- `end_date` (Timestamp)
