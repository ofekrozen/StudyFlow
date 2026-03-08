## Database Schema

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
