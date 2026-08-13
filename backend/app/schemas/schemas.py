from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Teacher Schemas
class TeacherSpecializationOut(BaseModel):
    id: int
    specialization: str
    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    department_id: int
    designation: str
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    research_area: Optional[str] = None
    phone: Optional[str] = None
    office_location: Optional[str] = None
    office_hours: Optional[str] = None
    profile_pic_url: Optional[str] = None
    experience: Optional[int] = 0

class TeacherCreate(TeacherBase):
    name: str
    email: EmailStr
    password: str

class TeacherOut(BaseModel):
    id: int
    designation: str
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    research_area: Optional[str] = None
    phone: Optional[str] = None
    office_location: Optional[str] = None
    office_hours: Optional[str] = None
    profile_pic_url: Optional[str] = None
    experience: Optional[int] = 0
    department: DepartmentOut
    user: UserOut
    specializations: Optional[List[TeacherSpecializationOut]] = []
    class Config:
        from_attributes = True

# Portfolio Item Schemas
class CertificateBase(BaseModel):
    title: str
    issuing_organization: str
    issue_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class CertificateOut(CertificateBase):
    id: int
    class Config:
        from_attributes = True

class AchievementBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[date] = None
    achievement_type: Optional[str] = None

class AchievementOut(AchievementBase):
    id: int
    class Config:
        from_attributes = True

class ResearchPaperBase(BaseModel):
    title: str
    journal: str
    publication_date: Optional[date] = None
    paper_url: Optional[str] = None
    authors: Optional[str] = None

class ResearchPaperOut(ResearchPaperBase):
    id: int
    class Config:
        from_attributes = True

class InternshipBase(BaseModel):
    company: str
    role: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class InternshipOut(InternshipBase):
    id: int
    class Config:
        from_attributes = True

class PatentBase(BaseModel):
    title: str
    patent_number: str
    status: Optional[str] = None
    publication_date: Optional[date] = None

class PatentOut(PatentBase):
    id: int
    class Config:
        from_attributes = True

class HackathonBase(BaseModel):
    name: str
    project_title: Optional[str] = None
    result: Optional[str] = None
    date: Optional[date] = None

class HackathonOut(HackathonBase):
    id: int
    class Config:
        from_attributes = True

# Student Schemas
class StudentBase(BaseModel):
    roll_number: str
    reg_number: str
    univ_roll_number: str
    mobile: Optional[str] = None
    department_id: int
    year: int
    semester: int
    section: str
    batch: Optional[str] = None
    skills: Optional[str] = None # JSON string
    linkedin: Optional[str] = None
    github: Optional[str] = None
    resume_url: Optional[str] = None
    profile_pic_url: Optional[str] = None
    guide_id: Optional[int] = None
    
    # New profile fields
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    college: Optional[str] = "University College of Engineering"
    program: Optional[str] = "B.Tech"
    class_name: Optional[str] = None
    admission_year: Optional[int] = None
    cgpa: Optional[float] = None
    is_deleted: Optional[bool] = False

class StudentCreate(StudentBase):
    name: str
    email: EmailStr
    password: str

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    reg_number: Optional[str] = None
    univ_roll_number: Optional[str] = None
    department_id: Optional[int] = None
    mobile: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    skills: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    resume_url: Optional[str] = None
    profile_pic_url: Optional[str] = None
    guide_id: Optional[int] = None
    
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    college: Optional[str] = None
    program: Optional[str] = None
    class_name: Optional[str] = None
    admission_year: Optional[int] = None
    cgpa: Optional[float] = None

class StudentOut(StudentBase):
    id: int
    user: UserOut
    department: DepartmentOut
    guide: Optional[TeacherOut] = None
    class Config:
        from_attributes = True

# Project Files Schemas
class ProjectFileBase(BaseModel):
    file_type: str
    file_name: str
    file_path: str

class ProjectFileOut(ProjectFileBase):
    id: int
    uploaded_at: datetime
    class Config:
        from_attributes = True

# Project Progress Update Schemas
class ProgressUpdateBase(BaseModel):
    week_number: int
    work_done: str
    progress_percentage: int
    hours_worked: Optional[int] = 0
    challenges: Optional[str] = None
    next_week_plan: Optional[str] = None
    github_link: Optional[str] = None
    files_json: Optional[str] = None # JSON array of files

class ProgressUpdateCreate(ProgressUpdateBase):
    pass

class ProgressUpdateOut(ProgressUpdateBase):
    id: int
    updated_at: datetime
    class Config:
        from_attributes = True

# Project Feedback Schemas
class FeedbackBase(BaseModel):
    rating: Optional[int] = None
    comments: Optional[str] = None
    positive_points: Optional[str] = None
    areas_of_improvement: Optional[str] = None
    recommendations: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackOut(FeedbackBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    category: Optional[str] = None
    technologies: Optional[str] = None
    difficulty_level: Optional[str] = "intermediate"
    team_size: Optional[int] = 1
    github_repo: Optional[str] = None
    live_url: Optional[str] = None
    figma_url: Optional[str] = None
    doc_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    group_members: Optional[str] = None # JSON list of member objects

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    category: Optional[str] = None
    technologies: Optional[str] = None
    difficulty_level: Optional[str] = None
    team_size: Optional[int] = None
    github_repo: Optional[str] = None
    live_url: Optional[str] = None
    figma_url: Optional[str] = None
    doc_url: Optional[str] = None
    status: Optional[str] = None
    marks: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    group_members: Optional[str] = None

class ProjectOut(ProjectBase):
    id: int
    status: str
    marks: int
    student_id: int
    created_at: datetime
    updated_at: datetime
    student: StudentOut
    files: List[ProjectFileOut] = []
    progress_updates: List[ProgressUpdateOut] = []
    feedbacks: List[FeedbackOut] = []
    class Config:
        from_attributes = True

class StudentWithProjectsOut(StudentOut):
    projects: List[ProjectOut] = []


# Meeting Schemas
class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: Optional[int] = 30
    join_url: Optional[str] = None
    student_id: int

class MeetingCreate(MeetingBase):
    pass

class MeetingOut(MeetingBase):
    id: int
    status: str
    created_by: int
    created_at: datetime
    class Config:
        from_attributes = True

# Chat Message Schemas
class ChatMessageBase(BaseModel):
    receiver_id: int
    message: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageOut(ChatMessageBase):
    id: int
    sender_id: int
    sent_at: datetime
    is_read: bool
    class Config:
        from_attributes = True

# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str
    content: str
    target_audience: Optional[str] = "all"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementOut(AnnouncementBase):
    id: int
    created_by: int
    created_at: datetime
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    notification_type: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# AI Recommendation Schema
class AIRecommendationRequest(BaseModel):
    skills: List[str]
    domain: str
    difficulty_level: str

class AIWeeklyProgressRequest(BaseModel):
    bullet_points: str

# Milestone Schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = "pending"
    marks: Optional[int] = None
    max_marks: Optional[int] = 20
    feedback: Optional[str] = None

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneOut(MilestoneBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

# GithubIntegration Schemas
class GithubIntegrationBase(BaseModel):
    repo_name: Optional[str] = None
    branch: Optional[str] = "main"
    commit_count: Optional[int] = 0
    stars: Optional[int] = 0
    issues: Optional[int] = 0
    latest_commit: Optional[str] = None

class GithubIntegrationCreate(GithubIntegrationBase):
    pass

class GithubIntegrationOut(GithubIntegrationBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

# PlacementRecord Schemas
class PlacementRecordBase(BaseModel):
    company_name: str
    role: Optional[str] = None
    status: Optional[str] = "applied"
    salary_package: Optional[str] = None
    interview_date: Optional[date] = None
    offer_letter_url: Optional[str] = None

class PlacementRecordCreate(PlacementRecordBase):
    pass

class PlacementRecordOut(PlacementRecordBase):
    id: int
    student_id: int
    class Config:
        from_attributes = True

# AbstractReview Schemas
class AbstractReviewBase(BaseModel):
    project_id: int
    status: Optional[str] = "pending_review"
    marks: Optional[int] = 0
    remarks: Optional[str] = None
    version: Optional[int] = 1
    abstract_text: Optional[str] = None

class AbstractReviewCreate(BaseModel):
    project_id: int
    abstract_text: str

class AbstractReviewEvaluate(BaseModel):
    status: str
    marks: int
    remarks: str

class AbstractReviewOut(AbstractReviewBase):
    id: int
    reviewed_at: datetime
    class Config:
        from_attributes = True

# SynopsisReview Schemas
class SynopsisReviewBase(BaseModel):
    project_id: int
    status: Optional[str] = "pending_review"
    problem_statement: Optional[str] = None
    objectives: Optional[str] = None
    literature_survey: Optional[str] = None
    proposed_methodology: Optional[str] = None
    expected_outcomes: Optional[str] = None
    remarks: Optional[str] = None

class SynopsisReviewCreate(SynopsisReviewBase):
    pass

class SynopsisReviewEvaluate(BaseModel):
    status: str
    remarks: str

class SynopsisReviewOut(SynopsisReviewBase):
    id: int
    reviewed_at: datetime
    class Config:
        from_attributes = True

# WeeklyReview Schemas
class WeeklyReviewBase(BaseModel):
    progress_update_id: int
    status: str
    feedback: Optional[str] = None

class WeeklyReviewCreate(WeeklyReviewBase):
    pass

class WeeklyReviewOut(WeeklyReviewBase):
    id: int
    reviewed_at: datetime
    class Config:
        from_attributes = True

# ReportReview Schemas
class ReportReviewBase(BaseModel):
    project_id: int
    report_type: str
    status: Optional[str] = "pending"
    feedback: Optional[str] = None
    annotations: Optional[str] = None
    version: Optional[int] = 1

class ReportReviewCreate(ReportReviewBase):
    pass

class ReportReviewOut(ReportReviewBase):
    id: int
    reviewed_at: datetime
    class Config:
        from_attributes = True

# PlagiarismReport Schemas
class PlagiarismReportBase(BaseModel):
    project_id: int
    similarity_percentage: Optional[float] = 0.0
    status: Optional[str] = "pending_review"
    sources_json: Optional[str] = None
    matched_paragraphs_json: Optional[str] = None
    ai_content_percentage: Optional[float] = 0.0
    risk_level: Optional[str] = "low"
    ai_summary: Optional[str] = None

class PlagiarismReportCreate(PlagiarismReportBase):
    pass

class PlagiarismReportOut(PlagiarismReportBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# VivaMark Schemas
class VivaMarkBase(BaseModel):
    student_id: int
    project_id: int
    questions_asked: Optional[str] = None
    student_answers: Optional[str] = None
    marks: Optional[int] = 0
    remarks: Optional[str] = None
    audio_url: Optional[str] = None

class VivaMarkCreate(VivaMarkBase):
    pass

class VivaMarkOut(VivaMarkBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Rubric Schemas
class RubricBase(BaseModel):
    project_id: int
    student_id: int
    problem_definition: Optional[int] = 0
    literature_survey: Optional[int] = 0
    innovation: Optional[int] = 0
    design: Optional[int] = 0
    coding: Optional[int] = 0
    testing: Optional[int] = 0
    documentation: Optional[int] = 0
    presentation: Optional[int] = 0
    viva: Optional[int] = 0
    total_marks: Optional[int] = 0
    remarks: Optional[str] = None

class RubricCreate(RubricBase):
    pass

class RubricOut(RubricBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# AIReview Schemas
class AIReviewBase(BaseModel):
    project_id: int
    review_type: str
    quality_metrics_json: Optional[str] = None
    suggestions: Optional[str] = None
    original_text: Optional[str] = None

class AIReviewCreate(AIReviewBase):
    pass

class AIReviewOut(AIReviewBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Analytics Schemas
class AnalyticsBase(BaseModel):
    metric_key: str
    metric_value: str

class AnalyticsOut(AnalyticsBase):
    id: int
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Complete Project Lifecycle Schemas ---

class ProjectProposalBase(BaseModel):
    title: str
    domain: Optional[str] = None
    category: Optional[str] = None
    problem_statement: Optional[str] = None
    objectives: Optional[str] = None
    existing_system: Optional[str] = None
    proposed_system: Optional[str] = None
    scope: Optional[str] = None
    expected_outcome: Optional[str] = None
    technologies_used: Optional[str] = None
    programming_language: Optional[str] = None
    database: Optional[str] = None
    tools_used: Optional[str] = None
    project_duration: Optional[str] = None
    team_members: Optional[str] = None

class ProjectProposalCreate(ProjectProposalBase):
    proposal_pdf_url: Optional[str] = None
    synopsis_url: Optional[str] = None
    literature_survey_url: Optional[str] = None
    initial_diagram_url: Optional[str] = None

class ProjectProposalOut(ProjectProposalBase):
    id: int
    student_id: int
    project_id: Optional[int] = None
    proposal_pdf_url: Optional[str] = None
    synopsis_url: Optional[str] = None
    literature_survey_url: Optional[str] = None
    initial_diagram_url: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    deadline: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class WeeklyProgressBase(BaseModel):
    week_number: int
    work_completed: str
    objectives_achieved: str
    modules_completed: str
    hours_worked: int
    current_progress: int
    challenges_faced: str
    next_week_plan: str
    github_repo_link: Optional[str] = None
    live_demo_link: Optional[str] = None

class WeeklyProgressCreate(WeeklyProgressBase):
    source_code_url: Optional[str] = None
    images_url: Optional[str] = None
    videos_url: Optional[str] = None
    documents_url: Optional[str] = None
    screenshots_url: Optional[str] = None
    database_backup_url: Optional[str] = None

class WeeklyProgressOut(WeeklyProgressBase):
    id: int
    project_id: int
    source_code_url: Optional[str] = None
    images_url: Optional[str] = None
    videos_url: Optional[str] = None
    documents_url: Optional[str] = None
    screenshots_url: Optional[str] = None
    database_backup_url: Optional[str] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class WeeklyFeedbackBase(BaseModel):
    weekly_progress_id: int
    status: str
    comments: Optional[str] = None
    weekly_marks: Optional[int] = None

class WeeklyFeedbackCreate(WeeklyFeedbackBase):
    pass

class WeeklyFeedbackOut(WeeklyFeedbackBase):
    id: int
    reviewed_at: datetime
    class Config:
        from_attributes = True

class ProjectMilestoneBase(BaseModel):
    name: str
    status: str
    progress_percentage: int
    target_date: Optional[str] = None

class ProjectMilestoneOut(ProjectMilestoneBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

class MeetingScheduleBase(BaseModel):
    meeting_date: str
    time: str
    discussion: Optional[str] = None
    action_items: Optional[str] = None
    attendance: Optional[str] = None

class MeetingScheduleCreate(MeetingScheduleBase):
    student_id: int
    guide_id: int

class MeetingScheduleOut(MeetingScheduleBase):
    id: int
    project_id: int
    student_id: int
    guide_id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class ProjectReportBase(BaseModel):
    github_repository: Optional[str] = None
    deployment_link: Optional[str] = None

class ProjectReportCreate(ProjectReportBase):
    final_report_url: Optional[str] = None
    research_paper_url: Optional[str] = None
    ppt_url: Optional[str] = None
    source_code_zip_url: Optional[str] = None
    poster_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    user_manual_url: Optional[str] = None
    database_backup_url: Optional[str] = None

class ProjectReportOut(ProjectReportBase):
    id: int
    project_id: int
    final_report_url: Optional[str] = None
    research_paper_url: Optional[str] = None
    ppt_url: Optional[str] = None
    source_code_zip_url: Optional[str] = None
    poster_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    user_manual_url: Optional[str] = None
    database_backup_url: Optional[str] = None
    submission_date: datetime
    version: int
    class Config:
        from_attributes = True

class ResearchPapersBase(BaseModel):
    title: str
    abstract: str
    keywords: str
    conference: Optional[str] = None
    journal: Optional[str] = None

class ResearchPapersCreate(ResearchPapersBase):
    paper_url: str

class ResearchPapersOut(ResearchPapersBase):
    id: int
    student_id: int
    project_id: int
    paper_url: str
    status: str
    review_feedback: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class FinalEvaluationBase(BaseModel):
    weekly_perf_marks: float
    proj_impl_marks: float
    final_report_marks: float
    research_paper_marks: float
    viva_marks: float
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    future_scope: Optional[str] = None
    recommendation: Optional[str] = None

class FinalEvaluationCreate(FinalEvaluationBase):
    pass

class FinalEvaluationOut(FinalEvaluationBase):
    id: int
    project_id: int
    total_marks: float
    grade: str
    guide_approval: bool
    created_at: datetime
    class Config:
        from_attributes = True

class WeeklyMarksBase(BaseModel):
    week_number: int
    marks: int
    max_marks: Optional[int] = 10

class WeeklyMarksOut(WeeklyMarksBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

class GuideRemarksBase(BaseModel):
    remarks: str

class GuideRemarksOut(GuideRemarksBase):
    id: int
    project_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ProjectStatusBase(BaseModel):
    status: str
    grade: Optional[str] = None
    total_marks: Optional[float] = None
    guide_approved: Optional[bool] = False

class ProjectStatusOut(ProjectStatusBase):
    id: int
    project_id: int
    updated_at: datetime
    class Config:
        from_attributes = True
