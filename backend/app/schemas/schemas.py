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
class TeacherBase(BaseModel):
    department_id: int
    designation: str

class TeacherCreate(TeacherBase):
    name: str
    email: EmailStr
    password: str

class TeacherOut(BaseModel):
    id: int
    designation: str
    department: DepartmentOut
    user: UserOut
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
