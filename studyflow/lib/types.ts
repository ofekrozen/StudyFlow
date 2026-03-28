export interface Institution {
  institution_id: string
  institution_name: string
}

export interface Semester {
  semester_id: string
  institution_id: string
  semester_name: string
  semester_start: string
  semester_end: string
  is_active: boolean
}

export interface Professor {
  professor_id: string
  institution_id: string
  professor_name: string
}

export interface Course {
  course_id: string
  institution_id: string
  semester_id: string
  syllabus_id: string | null
  course_name: string
  exam_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CourseEnrollment {
  enrollment_id: string
  user_id: string
  course_id: string
  professor_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface User {
  user_id: string
  institution_id: string | null
  email: string
  phone_number: string | null
  auth_provider: string | null
  streak_count: number
  last_login: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Subscription {
  subscription_id: string
  user_id: string
  plan: 'free' | 'pro'
  end_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MaterialType {
  material_type_id: string
  material_type_name: string
}

export interface CourseSubject {
  subject_id: string
  course_id: string
  subject_name: string
  subject_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SocraticTutorSession {
  session_id: string
  enrollment_id: string
  subject_id: string
  session_date: string | null
  ai_questions: unknown[] | null
  user_answers: unknown[] | null
  ai_feedback: unknown[] | null
  ai_score: number | null
  weak_points: unknown[]
  hints_given: number
  questions_count: number
  session_status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SubjectMastery {
  mastery_id: string
  enrollment_id: string
  subject_id: string
  mastery_score: number
  decay_rate: number
  last_practiced_at: string | null
  next_review_at: string | null
}

// Flat shape returned by the enrolled-courses JOIN query on the dashboard
export interface EnrolledCourse {
  enrollment_id: string
  course_id: string
  course_name: string
  exam_date: string | null
  semester_id: string
  institution_id: string
  professor_id: string
  professor_name: string
  is_active: boolean
}
