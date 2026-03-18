-- Allow course_enrollment to exist without a professor (professor is optional)
ALTER TABLE course_enrollment ALTER COLUMN professor_id DROP NOT NULL;
