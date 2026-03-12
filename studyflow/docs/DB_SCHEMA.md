## Database Schema

- **Users Table:**
- `user_id` (UUID, Primary Key)
- `institution_id` (UUID, Foreign Key)
- `email` (String)
- `phone_number` (String)
- `auth_provider` (String)
- `subscription_id` (UUID, Foreign Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Institutions Table:**
- `institution_id` (UUID, Primary Key)
- `institution_name` (String)

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
- `exam_date` (Date)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **User_Courses Table:**
- `user_course_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `course_id` (UUID, Foreign Key)
- `is_active` (Boolean)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

- **Syllabus Table:**
- `syllabus_id` (UUID, Primary Key)
- `course_id` (UUID, Foreign Key)
- `file_url` (String)
- `parsed_text` (Text - for RAG context)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `deleted_at` (Timestamp)

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

**Subscriptions Table:**

- `subscription_id` (UUID, Primary Key)
- `plan` (Enum: 'free', 'pro')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `previous_plan` (Enum: 'free', 'pro')
- `deleted_at` (Timestamp)
