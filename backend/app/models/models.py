from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey, Text, Date, DateTime, Table, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.db import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False, index=True)

    teachers = relationship("Teacher", back_populates="department")
    students = relationship("Student", back_populates="department")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum("student", "teacher", "hod", "admin"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    teacher_profile = relationship("Teacher", uselist=False, back_populates="user", cascade="all, delete-orphan")
    student_profile = relationship("Student", uselist=False, back_populates="user", cascade="all, delete-orphan")
    created_announcements = relationship("Announcement", back_populates="creator")
    notifications = relationship("Notification", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), nullable=False)
    joined_at = Column(DateTime, server_default=func.now())
    
    # New teacher details columns
    employee_id = Column(String(50), unique=True, nullable=True)
    qualification = Column(String(255), default="Ph.D.")
    research_area = Column(Text, default="Software Engineering, Distributed Systems")
    phone = Column(String(20), default="+1-555-0199")
    office_location = Column(String(255), default="Block C, Room 302")
    office_hours = Column(String(255), default="Mon/Wed/Fri 2:00 PM - 4:00 PM")
    profile_pic_url = Column(String(255))
    experience = Column(Integer, default=0)

    user = relationship("User", back_populates="teacher_profile")
    department = relationship("Department", back_populates="teachers")
    students = relationship("Student", back_populates="guide", foreign_keys="[Student.guide_id]")
    feedbacks = relationship("Feedback", back_populates="teacher")
    specializations = relationship("TeacherSpecialization", back_populates="teacher", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    reg_number = Column(String(50), unique=True, nullable=False)
    univ_roll_number = Column(String(50), unique=True, nullable=False)
    mobile = Column(String(15))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String(10), nullable=False)
    guide_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    batch = Column(String(20))
    skills = Column(Text) # Stored as JSON string
    linkedin = Column(String(255))
    github = Column(String(255))
    resume_url = Column(String(255))
    profile_pic_url = Column(String(255))
    
    # New profile and academic details columns
    gender = Column(String(20))
    date_of_birth = Column(String(50))
    address = Column(Text)
    college = Column(String(255), default="University College of Engineering")
    program = Column(String(100), default="B.Tech")
    class_name = Column(String(100))
    admission_year = Column(Integer)
    cgpa = Column(Float)
    is_deleted = Column(Boolean, default=False)

    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    guide = relationship("Teacher", back_populates="students", foreign_keys=[guide_id])
    projects = relationship("Project", back_populates="student", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="student", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="student", cascade="all, delete-orphan")
    research_papers = relationship("ResearchPaper", back_populates="student", cascade="all, delete-orphan")
    internships = relationship("Internship", back_populates="student", cascade="all, delete-orphan")
    patents = relationship("Patent", back_populates="student", cascade="all, delete-orphan")
    hackathons = relationship("Hackathon", back_populates="student", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="student", cascade="all, delete-orphan")
    placement_records = relationship("PlacementRecord", back_populates="student", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    abstract = Column(Text)
    description = Column(Text)
    domain = Column(String(100), index=True)
    category = Column(String(100))
    technologies = Column(Text) # Comma-separated
    difficulty_level = Column(Enum("beginner", "intermediate", "advanced"), default="intermediate")
    team_size = Column(Integer, default=1)
    github_repo = Column(String(255))
    live_url = Column(String(255))
    figma_url = Column(String(255))
    doc_url = Column(String(255))
    status = Column(Enum("pending_review", "approved", "revision_requested", "completed"), default="pending_review")
    marks = Column(Integer, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    group_members = Column(Text) # JSON string listing member details (name, roll, contact, section)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    student = relationship("Student", back_populates="projects")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    progress_updates = relationship("ProgressUpdate", back_populates="project", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    github_integration = relationship("GithubIntegration", uselist=False, back_populates="project", cascade="all, delete-orphan")

class ProjectFile(Base):
    __tablename__ = "project_files"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    file_type = Column(Enum("report_pdf", "ppt", "zip_code", "image", "video"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="files")

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    work_done = Column(Text, nullable=False)
    progress_percentage = Column(Integer, nullable=False)
    hours_worked = Column(Integer, default=0)
    challenges = Column(Text)
    next_week_plan = Column(Text)
    github_link = Column(String(255))
    files_json = Column(Text) # JSON string array of upload paths/names
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="progress_updates")

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer)
    comments = Column(Text)
    positive_points = Column(Text)
    areas_of_improvement = Column(Text)
    recommendations = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project", back_populates="feedbacks")
    teacher = relationship("Teacher", back_populates="feedbacks")

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    join_url = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum("scheduled", "cancelled", "completed"), default="scheduled")
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="meetings")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime, server_default=func.now())
    is_read = Column(Boolean, default=False)

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    issue_date = Column(Date)
    credential_id = Column(String(255))
    credential_url = Column(String(255))

    student = relationship("Student", back_populates="certificates")

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    date = Column(Date)
    achievement_type = Column(String(100))

    student = relationship("Student", back_populates="achievements")

class ResearchPaper(Base):
    __tablename__ = "research_papers"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    journal = Column(String(255), nullable=False)
    publication_date = Column(Date)
    paper_url = Column(String(255))
    authors = Column(String(255))

    student = relationship("Student", back_populates="research_papers")

class Internship(Base):
    __tablename__ = "internships"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    description = Column(Text)

    student = relationship("Student", back_populates="internships")

class Patent(Base):
    __tablename__ = "patents"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    patent_number = Column(String(100), unique=True, nullable=False)
    status = Column(String(50))
    publication_date = Column(Date)

    student = relationship("Student", back_populates="patents")

class Hackathon(Base):
    __tablename__ = "hackathons"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    project_title = Column(String(255))
    result = Column(String(100))
    date = Column(Date)

    student = relationship("Student", back_populates="hackathons")

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    target_audience = Column(Enum("all", "students", "teachers"), default="all")
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    creator = relationship("User", back_populates="created_announcements")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(Text)
    timestamp = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activity_logs")

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    deadline = Column(String(100))
    status = Column(Enum("pending", "in_progress", "completed"), default="pending")
    marks = Column(Integer)
    max_marks = Column(Integer, default=20)
    feedback = Column(Text)

    project = relationship("Project", back_populates="milestones")

class GithubIntegration(Base):
    __tablename__ = "github_integrations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    repo_name = Column(String(255))
    branch = Column(String(100), default="main")
    commit_count = Column(Integer, default=0)
    stars = Column(Integer, default=0)
    issues = Column(Integer, default=0)
    latest_commit = Column(String(255))

    project = relationship("Project", back_populates="github_integration")

class PlacementRecord(Base):
    __tablename__ = "placement_records"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(255), nullable=False)
    role = Column(String(255))
    status = Column(Enum("applied", "interviewing", "offered", "rejected"), default="applied")
    salary_package = Column(String(100))
    interview_date = Column(Date)
    offer_letter_url = Column(String(255))

    student = relationship("Student", back_populates="placement_records")

class AbstractReview(Base):
    __tablename__ = "abstract_reviews"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="pending_review") # approved, rejected, revision_requested, pending_review
    marks = Column(Integer, default=0)
    remarks = Column(Text)
    version = Column(Integer, default=1)
    abstract_text = Column(Text)
    reviewed_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class SynopsisReview(Base):
    __tablename__ = "synopsis_reviews"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="pending_review") # approved, rejected, revision_requested
    problem_statement = Column(Text)
    objectives = Column(Text)
    literature_survey = Column(Text)
    proposed_methodology = Column(Text)
    expected_outcomes = Column(Text)
    remarks = Column(Text)
    reviewed_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"
    id = Column(Integer, primary_key=True, index=True)
    progress_update_id = Column(Integer, ForeignKey("progress_updates.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="approved") # approved, rejected, revision_requested
    feedback = Column(Text)
    reviewed_at = Column(DateTime, server_default=func.now())

    progress_update = relationship("ProgressUpdate")

class ReportReview(Base):
    __tablename__ = "report_reviews"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String(50), nullable=False) # srs, design_document, mid_review, final_report, ppt, poster
    status = Column(String(50), default="pending") # pending, approved, revision_requested, rejected
    feedback = Column(Text)
    annotations = Column(Text) # JSON string representation
    version = Column(Integer, default=1)
    reviewed_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class PlagiarismReport(Base):
    __tablename__ = "plagiarism_reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    similarity_percentage = Column(Float, default=0.0)
    status = Column(String(50), default="pending_review") # acceptable, high_risk, pending_review
    sources_json = Column(Text) # JSON string listing matched sources
    matched_paragraphs_json = Column(Text) # JSON string listing matched paragraphs
    ai_content_percentage = Column(Float, default=0.0)
    risk_level = Column(String(20), default="low") # low, medium, high
    ai_summary = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class VivaMark(Base):
    __tablename__ = "viva_marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    questions_asked = Column(Text) # JSON list
    student_answers = Column(Text) # JSON list
    marks = Column(Integer, default=0)
    remarks = Column(Text)
    audio_url = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student")
    project = relationship("Project")

class Rubric(Base):
    __tablename__ = "rubrics"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    rubrics_json = Column(Text, nullable=True) # JSON representation of R1-R6 scores
    problem_definition = Column(Integer, default=0)
    literature_survey = Column(Integer, default=0)
    innovation = Column(Integer, default=0)
    design = Column(Integer, default=0)
    coding = Column(Integer, default=0)
    testing = Column(Integer, default=0)
    documentation = Column(Integer, default=0)
    presentation = Column(Integer, default=0)
    viva = Column(Integer, default=0)
    total_marks = Column(Integer, default=0)
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")
    student = relationship("Student")

class AIReview(Base):
    __tablename__ = "ai_reviews"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    review_type = Column(String(50)) # abstract, report, plagiarism
    quality_metrics_json = Column(Text)
    suggestions = Column(Text)
    original_text = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    metric_key = Column(String(100), unique=True, index=True)
    metric_value = Column(Text)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class TeacherSpecialization(Base):
    __tablename__ = "teacher_specializations"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    specialization = Column(String(100), nullable=False)

    teacher = relationship("Teacher", back_populates="specializations")

class GuideAllocation(Base):
    __tablename__ = "guide_allocations"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    allocated_at = Column(DateTime, server_default=func.now())

class GuideWorkload(Base):
    __tablename__ = "guide_workloads"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), unique=True, nullable=False)
    max_capacity = Column(Integer, default=20)

class AcademicYear(Base):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    class_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    capacity = Column(Integer, default=60)

    department = relationship("Department")
    academic_year = relationship("AcademicYear")
    section = relationship("Section")
    class_teacher = relationship("Teacher")

class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False)

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

# --- Complete Project Lifecycle Models ---

class ProjectProposal(Base):
    __tablename__ = "project_proposals"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)
    problem_statement = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    existing_system = Column(Text, nullable=True)
    proposed_system = Column(Text, nullable=True)
    scope = Column(Text, nullable=True)
    expected_outcome = Column(Text, nullable=True)
    technologies_used = Column(Text, nullable=True)
    programming_language = Column(String(100), nullable=True)
    database = Column(String(100), nullable=True)
    tools_used = Column(Text, nullable=True)
    project_duration = Column(String(100), nullable=True)
    team_members = Column(Text, nullable=True)
    proposal_pdf_url = Column(String(255), nullable=True)
    synopsis_url = Column(String(255), nullable=True)
    literature_survey_url = Column(String(255), nullable=True)
    initial_diagram_url = Column(String(255), nullable=True)
    status = Column(Enum("pending", "approved", "rejected", "revision_required", "title_approved", "pending_documents"), default="pending")
    remarks = Column(Text, nullable=True)
    deadline = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    student = relationship("Student")
    project = relationship("Project")

class WeeklyProgress(Base):
    __tablename__ = "weekly_progress"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    work_completed = Column(Text, nullable=False)
    objectives_achieved = Column(Text, nullable=False)
    modules_completed = Column(Text, nullable=False) # JSON or comma-separated
    hours_worked = Column(Integer, default=0)
    current_progress = Column(Integer, default=0) # Slider 0-100%
    challenges_faced = Column(Text)
    next_week_plan = Column(Text)
    github_repo_link = Column(String(255))
    live_demo_link = Column(String(255))
    source_code_url = Column(String(255))
    images_url = Column(Text) # Comma-separated or JSON list
    videos_url = Column(String(255))
    documents_url = Column(String(255))
    screenshots_url = Column(Text)
    database_backup_url = Column(String(255))
    status = Column(Enum("pending", "submitted", "reviewed", "revision_required", "approved"), default="pending")
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class WeeklyFeedback(Base):
    __tablename__ = "weekly_feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    weekly_progress_id = Column(Integer, ForeignKey("weekly_progress.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum("approved", "rejected", "revision_required"), default="approved")
    comments = Column(Text)
    weekly_marks = Column(Integer)
    reviewed_at = Column(DateTime, server_default=func.now())

    weekly_progress = relationship("WeeklyProgress")

class ProjectMilestone(Base):
    __tablename__ = "project_milestones"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    status = Column(Enum("pending", "completed"), default="pending")
    progress_percentage = Column(Integer, default=0)
    target_date = Column(String(100))

    project = relationship("Project")

class MeetingSchedule(Base):
    __tablename__ = "meeting_schedules"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    guide_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    meeting_date = Column(String(100), nullable=False)
    time = Column(String(100), nullable=False)
    discussion = Column(Text)
    action_items = Column(Text)
    attendance = Column(Text)
    status = Column(Enum("requested", "approved", "completed", "cancelled"), default="requested")
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")
    student = relationship("Student")
    guide = relationship("Teacher")

class ProjectReport(Base):
    __tablename__ = "project_reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    final_report_url = Column(String(255))
    research_paper_url = Column(String(255))
    ppt_url = Column(String(255))
    source_code_zip_url = Column(String(255))
    poster_url = Column(String(255))
    demo_video_url = Column(String(255))
    github_repository = Column(String(255))
    deployment_link = Column(String(255))
    user_manual_url = Column(String(255))
    database_backup_url = Column(String(255))
    submission_date = Column(DateTime, server_default=func.now())
    version = Column(Integer, default=1)

    project = relationship("Project")

class ResearchPapers(Base):
    __tablename__ = "research_papers_lifecycle"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    abstract = Column(Text, nullable=False)
    keywords = Column(String(255), nullable=False)
    conference = Column(String(255))
    journal = Column(String(255))
    paper_url = Column(String(255), nullable=False)
    status = Column(Enum("uploaded", "pending_review", "approved"), default="uploaded")
    review_feedback = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student")
    project = relationship("Project")

class FinalEvaluation(Base):
    __tablename__ = "final_evaluations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    weekly_perf_marks = Column(Float, nullable=False)
    proj_impl_marks = Column(Float, nullable=False)
    final_report_marks = Column(Float, nullable=False)
    research_paper_marks = Column(Float, nullable=False)
    viva_marks = Column(Float, nullable=False)
    total_marks = Column(Float, nullable=False)
    grade = Column(String(10), nullable=False)
    strengths = Column(Text)
    weaknesses = Column(Text)
    suggestions = Column(Text)
    future_scope = Column(Text)
    recommendation = Column(Text)
    guide_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class WeeklyMarks(Base):
    __tablename__ = "weekly_marks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    marks = Column(Integer, nullable=False)
    max_marks = Column(Integer, default=10)

    project = relationship("Project")

class GuideRemarks(Base):
    __tablename__ = "guide_remarks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    remarks = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    project = relationship("Project")

class ProjectStatus(Base):
    __tablename__ = "project_status"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    grade = Column(String(10))
    total_marks = Column(Float)
    guide_approved = Column(Boolean, default=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project")
