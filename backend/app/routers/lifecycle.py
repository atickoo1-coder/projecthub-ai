from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import json
from datetime import datetime
from ..core.db import get_db
from ..core.security import get_current_user_payload
from ..models import models
from ..schemas import schemas
from ..services.ai_service import AIService

router = APIRouter(prefix="/api/lifecycle", tags=["lifecycle"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helpers
def get_student(payload: dict, db: Session) -> models.Student:
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can perform this action")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return user.student_profile

def get_teacher(payload: dict, db: Session) -> models.Teacher:
    if payload.get("role") != "teacher" and payload.get("role") != "hod":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.teacher_profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return user.teacher_profile

def save_file(file: UploadFile, subfolder: str) -> Optional[str]:
    if not file or not file.filename:
        return None
    folder = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    clean_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    filepath = os.path.join(folder, clean_filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return filepath.replace("\\", "/")

def get_member_details(team_members_str: Optional[str], db: Session):
    if not team_members_str:
        return []
    import re
    tokens = re.split(r'[,;\n\r]', team_members_str)
    members = []
    seen_ids = set()
    for token in tokens:
        clean_token = token.strip()
        if not clean_token:
            continue
        student = db.query(models.Student).join(models.User).filter(
            (models.Student.roll_number == clean_token) |
            (models.User.email == clean_token) |
            (models.User.name == clean_token)
        ).first()
        if student and student.id not in seen_ids:
            seen_ids.add(student.id)
            members.append({
                "id": student.id,
                "name": student.user.name,
                "roll_number": student.roll_number,
                "email": student.user.email,
                "department": student.department.code if student.department else "",
                "section": student.section
            })
    return members

# --- PROPOSAL WORKSPACE ---

@router.post("/proposal/draft")
def save_proposal_draft(
    title: str = Form(...),
    domain: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    problem_statement: Optional[str] = Form(None),
    objectives: Optional[str] = Form(None),
    existing_system: Optional[str] = Form(None),
    proposed_system: Optional[str] = Form(None),
    scope: Optional[str] = Form(None),
    expected_outcome: Optional[str] = Form(None),
    technologies_used: Optional[str] = Form(None),
    programming_language: Optional[str] = Form(None),
    database: Optional[str] = Form(None),
    tools_used: Optional[str] = Form(None),
    project_duration: Optional[str] = Form(None),
    team_members: Optional[str] = Form(None),
    proposal_pdf: Optional[UploadFile] = File(None),
    synopsis: Optional[UploadFile] = File(None),
    literature_survey: Optional[UploadFile] = File(None),
    initial_diagram: Optional[UploadFile] = File(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    student = get_student(payload, db)
    
    # Check if a proposal already exists for this student
    proposal = db.query(models.ProjectProposal).filter(models.ProjectProposal.student_id == student.id).first()
    
    pdf_url = save_file(proposal_pdf, "proposals")
    synopsis_url = save_file(synopsis, "synopsis")
    literature_url = save_file(literature_survey, "literature")
    diagram_url = save_file(initial_diagram, "diagrams")
    
    if proposal:
        if proposal.status == "approved":
            raise HTTPException(status_code=400, detail="Cannot edit approved proposal")
        
        # Update details
        proposal.title = title
        if domain is not None: proposal.domain = domain
        if category is not None: proposal.category = category
        if problem_statement is not None: proposal.problem_statement = problem_statement
        if objectives is not None: proposal.objectives = objectives
        if existing_system is not None: proposal.existing_system = existing_system
        if proposed_system is not None: proposal.proposed_system = proposed_system
        if scope is not None: proposal.scope = scope
        if expected_outcome is not None: proposal.expected_outcome = expected_outcome
        if technologies_used is not None: proposal.technologies_used = technologies_used
        if programming_language is not None: proposal.programming_language = programming_language
        if database is not None: proposal.database = database
        if tools_used is not None: proposal.tools_used = tools_used
        if project_duration is not None: proposal.project_duration = project_duration
        if team_members is not None: proposal.team_members = team_members
        
        if pdf_url: proposal.proposal_pdf_url = pdf_url
        if synopsis_url: proposal.synopsis_url = synopsis_url
        if literature_url: proposal.literature_survey_url = literature_url
        if diagram_url: proposal.initial_diagram_url = diagram_url
    else:
        proposal = models.ProjectProposal(
            student_id=student.id,
            title=title,
            domain=domain,
            category=category,
            problem_statement=problem_statement,
            objectives=objectives,
            existing_system=existing_system,
            proposed_system=proposed_system,
            scope=scope,
            expected_outcome=expected_outcome,
            technologies_used=technologies_used,
            programming_language=programming_language,
            database=database,
            tools_used=tools_used,
            project_duration=project_duration or "4 months",
            team_members=team_members,
            proposal_pdf_url=pdf_url,
            synopsis_url=synopsis_url,
            literature_survey_url=literature_url,
            initial_diagram_url=diagram_url,
            status="pending"
        )
        db.add(proposal)
        
    db.commit()
    db.refresh(proposal)
    return {"detail": "Draft saved successfully", "proposal_id": proposal.id}

@router.post("/proposal/submit")
def submit_proposal(
    title: str = Form(...),
    domain: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    problem_statement: Optional[str] = Form(None),
    objectives: Optional[str] = Form(None),
    existing_system: Optional[str] = Form(None),
    proposed_system: Optional[str] = Form(None),
    scope: Optional[str] = Form(None),
    expected_outcome: Optional[str] = Form(None),
    technologies_used: Optional[str] = Form(None),
    programming_language: Optional[str] = Form(None),
    database: Optional[str] = Form(None),
    tools_used: Optional[str] = Form(None),
    project_duration: Optional[str] = Form(None),
    team_members: Optional[str] = Form(None),
    proposal_pdf: Optional[UploadFile] = File(None),
    synopsis: Optional[UploadFile] = File(None),
    literature_survey: Optional[UploadFile] = File(None),
    initial_diagram: Optional[UploadFile] = File(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    student = get_student(payload, db)
    proposal = db.query(models.ProjectProposal).filter(models.ProjectProposal.student_id == student.id).first()
    
    pdf_url = save_file(proposal_pdf, "proposals")
    synopsis_url = save_file(synopsis, "synopsis")
    literature_url = save_file(literature_survey, "literature")
    diagram_url = save_file(initial_diagram, "diagrams")
    
    if proposal:
        if proposal.status == "approved":
            raise HTTPException(status_code=400, detail="Cannot edit approved proposal")
        
        # If status is title_approved, this is stage 2 document submission
        if proposal.status == "title_approved":
            if not domain or not category or not problem_statement or not objectives or not proposed_system or not technologies_used:
                raise HTTPException(status_code=400, detail="Please fill in all required documents (Domain, Category, Problem Statement, Objectives, Proposed System, and Technologies)")
            
            proposal.title = title
            proposal.domain = domain
            proposal.category = category
            proposal.problem_statement = problem_statement
            proposal.objectives = objectives
            if existing_system is not None: proposal.existing_system = existing_system
            proposal.proposed_system = proposed_system
            if scope is not None: proposal.scope = scope
            if expected_outcome is not None: proposal.expected_outcome = expected_outcome
            proposal.technologies_used = technologies_used
            if programming_language is not None: proposal.programming_language = programming_language
            if database is not None: proposal.database = database
            if tools_used is not None: proposal.tools_used = tools_used
            if project_duration is not None: proposal.project_duration = project_duration
            if team_members is not None: proposal.team_members = team_members
            proposal.status = "pending_documents"
        else:
            # Initial stage 1 title submission
            proposal.title = title
            if team_members is not None: proposal.team_members = team_members
            proposal.status = "pending"
        
        if pdf_url: proposal.proposal_pdf_url = pdf_url
        if synopsis_url: proposal.synopsis_url = synopsis_url
        if literature_url: proposal.literature_survey_url = literature_url
        if diagram_url: proposal.initial_diagram_url = diagram_url
    else:
        # Initial submission
        proposal = models.ProjectProposal(
            student_id=student.id,
            title=title,
            domain=domain,
            category=category,
            problem_statement=problem_statement,
            objectives=objectives,
            existing_system=existing_system,
            proposed_system=proposed_system,
            scope=scope,
            expected_outcome=expected_outcome,
            technologies_used=technologies_used,
            programming_language=programming_language,
            database=database,
            tools_used=tools_used,
            project_duration=project_duration or "4 months",
            team_members=team_members,
            proposal_pdf_url=pdf_url,
            synopsis_url=synopsis_url,
            literature_survey_url=literature_url,
            initial_diagram_url=diagram_url,
            status="pending"
        )
        db.add(proposal)
        
    db.commit()
    db.refresh(proposal)
    
    # Notify Advisor Guide if allocated
    if student.guide_id:
        notif = models.Notification(
            user_id=student.guide.user_id,
            title="New Project Proposal Submitted",
            message=f"Student {student.user.name} ({student.roll_number}) has submitted a project proposal: {title}.",
            notification_type="proposal_submitted"
        )
        db.add(notif)
        db.commit()
        
    return {"detail": "Proposal submitted successfully", "proposal_id": proposal.id}

@router.get("/proposal/my")
def get_my_proposal(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    student = get_student(payload, db)
    proposal = db.query(models.ProjectProposal).filter(models.ProjectProposal.student_id == student.id).first()
    if not proposal:
        all_props = db.query(models.ProjectProposal).all()
        for p in all_props:
            if p.team_members and (student.roll_number in p.team_members or student.user.email in p.team_members):
                proposal = p
                break
    if not proposal:
        return {"status": "none"}
        
    members = get_member_details(proposal.team_members, db)
    res = {c.name: getattr(proposal, c.name) for c in proposal.__table__.columns}
    res["members"] = members
    res["student_name"] = proposal.student.user.name if proposal.student else "Unknown"
    res["roll_number"] = proposal.student.roll_number if proposal.student else ""
    res["guide_name"] = proposal.student.guide.user.name if proposal.student and proposal.student.guide else "Unassigned"
    res["is_lead"] = (proposal.student_id == student.id)
    return res

@router.delete("/proposal/{id}")
def delete_proposal_draft(id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    student = get_student(payload, db)
    proposal = db.query(models.ProjectProposal).filter(
        models.ProjectProposal.id == id,
        models.ProjectProposal.student_id == student.id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal draft not found")
    if proposal.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot delete approved proposal")
    db.delete(proposal)
    db.commit()
    return {"detail": "Draft deleted successfully"}

@router.get("/proposal/pending")
def get_pending_proposals(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    teacher = get_teacher(payload, db)
    proposals = db.query(models.ProjectProposal).join(models.Student).filter(
        models.Student.guide_id == teacher.id,
        models.ProjectProposal.status.in_(["pending", "title_approved", "pending_documents"])
    ).all()
    
    res = []
    for p in proposals:
        members = get_member_details(p.team_members, db)
        res.append({
            "id": p.id,
            "student_name": p.student.user.name,
            "roll_number": p.student.roll_number,
            "title": p.title,
            "domain": p.domain,
            "category": p.category,
            "problem_statement": p.problem_statement,
            "technologies_used": p.technologies_used,
            "proposal_pdf_url": p.proposal_pdf_url,
            "synopsis_url": p.synopsis_url,
            "literature_survey_url": p.literature_survey_url,
            "initial_diagram_url": p.initial_diagram_url,
            "status": p.status,
            "team_members": p.team_members,
            "members": members
        })
    return res

@router.post("/proposal/{id}/action")
def evaluate_proposal(
    id: int,
    action: str = Form(...), # title_approved, approved, rejected, revision_required
    remarks: Optional[str] = Form(None),
    deadline: Optional[str] = Form(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    teacher = get_teacher(payload, db)
    proposal = db.query(models.ProjectProposal).filter(models.ProjectProposal.id == id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if proposal.student.guide_id != teacher.id:
        raise HTTPException(status_code=403, detail="You are not the guide of this student")
        
    proposal.status = action
    proposal.remarks = remarks
    proposal.deadline = deadline
    
    # If approved, instantiate Project in the database (or approve existing unallocated one)
    if action == "approved":
        # Check if project already exists
        project = db.query(models.Project).filter(models.Project.student_id == proposal.student_id).first()
        if project:
            project.title = proposal.title
            project.domain = proposal.domain
            project.category = proposal.category
            project.technologies = proposal.technologies_used
            project.status = "approved"
        else:
            project = models.Project(
                title=proposal.title,
                domain=proposal.domain,
                category=proposal.category,
                technologies=proposal.technologies_used,
                student_id=proposal.student_id,
                status="approved"
            )
            db.add(project)
            db.flush()
        proposal.project_id = project.id
        
        # Auto-generate milestones
        milestones = ["Proposal Approved", "Requirement Analysis", "Design Phase", "Implementation", "Testing Suite", "Documentation", "Deployment", "Final Submission"]
        for idx, m_name in enumerate(milestones):
            m = models.ProjectMilestone(
                project_id=project.id,
                name=m_name,
                status="completed" if idx == 0 else "pending",
                progress_percentage=100 if idx == 0 else 0
            )
            db.add(m)
            
    db.commit()
    
    # Notify student
    notif = models.Notification(
        user_id=proposal.student.user_id,
        title=f"Project Proposal {action.replace('_', ' ').title()}",
        message=f"Your advisor guide {teacher.user.name} has marked your project proposal '{proposal.title}' as {action.upper()}.",
        notification_type="proposal_action"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": f"Proposal successfully updated to {action}"}

@router.get("/proposal/all")
def get_all_proposals(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view all proposals")
    proposals = db.query(models.ProjectProposal).all()
    res = []
    for p in proposals:
        members = get_member_details(p.team_members, db)
        res.append({
            "id": p.id,
            "student_name": p.student.user.name if p.student else "Unknown",
            "roll_number": p.student.roll_number if p.student else "",
            "title": p.title,
            "domain": p.domain,
            "category": p.category,
            "problem_statement": p.problem_statement,
            "technologies_used": p.technologies_used,
            "proposal_pdf_url": p.proposal_pdf_url,
            "synopsis_url": p.synopsis_url,
            "literature_survey_url": p.literature_survey_url,
            "initial_diagram_url": p.initial_diagram_url,
            "status": p.status,
            "guide_name": p.student.guide.user.name if p.student and p.student.guide else "Unassigned",
            "student_dept": p.student.department.code if p.student and p.student.department else "Unassigned",
            "team_members": p.team_members,
            "members": members
        })
    return res

# --- WEEKLY PROGRESS MODULE ---

@router.post("/weekly/submit")
def submit_weekly_progress(
    week_number: int = Form(...),
    work_completed: str = Form(...),
    objectives_achieved: str = Form(...),
    modules_completed: str = Form(...), # Comma-separated or JSON list
    hours_worked: int = Form(...),
    current_progress: int = Form(...),
    challenges_faced: str = Form(...),
    next_week_plan: str = Form(...),
    github_repo_link: Optional[str] = Form(None),
    live_demo_link: Optional[str] = Form(None),
    source_code: Optional[UploadFile] = File(None),
    image_files: List[UploadFile] = File([]),
    video_file: Optional[UploadFile] = File(None),
    doc_file: Optional[UploadFile] = File(None),
    screenshot_files: List[UploadFile] = File([]),
    db_backup: Optional[UploadFile] = File(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    student = get_student(payload, db)
    
    # Verify proposal is approved
    proposal = db.query(models.ProjectProposal).filter(
        models.ProjectProposal.student_id == student.id,
        models.ProjectProposal.status == "approved"
    ).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Locked: You cannot start weekly progress updates until your guide approves your Project Proposal."
        )
        
    project = db.query(models.Project).filter(models.Project.student_id == student.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Active project record not found")
        
    # Check if this week's progress is already logged
    existing_log = db.query(models.WeeklyProgress).filter(
        models.WeeklyProgress.project_id == project.id,
        models.WeeklyProgress.week_number == week_number
    ).first()
    
    src_url = save_file(source_code, "weekly/code")
    vid_url = save_file(video_file, "weekly/videos")
    doc_url = save_file(doc_file, "weekly/docs")
    db_url = save_file(db_backup, "weekly/backup")
    
    # Upload multiples
    img_urls = []
    for f in image_files:
        u = save_file(f, "weekly/images")
        if u: img_urls.append(u)
        
    shot_urls = []
    for f in screenshot_files:
        u = save_file(f, "weekly/shots")
        if u: shot_urls.append(u)
        
    if existing_log:
        existing_log.work_completed = work_completed
        existing_log.objectives_achieved = objectives_achieved
        existing_log.modules_completed = modules_completed
        existing_log.hours_worked = hours_worked
        existing_log.current_progress = current_progress
        existing_log.challenges_faced = challenges_faced
        existing_log.next_week_plan = next_week_plan
        existing_log.github_repo_link = github_repo_link
        existing_log.live_demo_link = live_demo_link
        existing_log.status = "submitted"
        
        if src_url: existing_log.source_code_url = src_url
        if vid_url: existing_log.videos_url = vid_url
        if doc_url: existing_log.documents_url = doc_url
        if db_url: existing_log.database_backup_url = db_url
        if img_urls: existing_log.images_url = json.dumps(img_urls)
        if shot_urls: existing_log.screenshots_url = json.dumps(shot_urls)
        log_record = existing_log
    else:
        log_record = models.WeeklyProgress(
            project_id=project.id,
            week_number=week_number,
            work_completed=work_completed,
            objectives_achieved=objectives_achieved,
            modules_completed=modules_completed,
            hours_worked=hours_worked,
            current_progress=current_progress,
            challenges_faced=challenges_faced,
            next_week_plan=next_week_plan,
            github_repo_link=github_repo_link,
            live_demo_link=live_demo_link,
            source_code_url=src_url,
            videos_url=vid_url,
            documents_url=doc_url,
            database_backup_url=db_url,
            images_url=json.dumps(img_urls),
            screenshots_url=json.dumps(shot_urls),
            status="submitted"
        )
        db.add(log_record)
        
    # Update project progress slider to match
    project.updated_at = datetime.now()
    
    db.commit()
    db.refresh(log_record)
    
    # Notify guide
    if student.guide_id:
        notif = models.Notification(
            user_id=student.guide.user_id,
            title="Weekly Progress Submitted",
            message=f"Student {student.user.name} submitted Week {week_number} logs ({current_progress}% progress).",
            notification_type="weekly_submitted"
        )
        db.add(notif)
        db.commit()
        
    return {"detail": "Weekly progress logged successfully", "log_id": log_record.id}

@router.get("/weekly/my")
def get_my_weekly_progress(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    student = get_student(payload, db)
    project = db.query(models.Project).filter(models.Project.student_id == student.id).first()
    if not project:
        return []
    
    logs = db.query(models.WeeklyProgress).filter(
        models.WeeklyProgress.project_id == project.id
    ).order_by(models.WeeklyProgress.week_number.asc()).all()
    
    res = []
    for l in logs:
        # Check feedback
        fb = db.query(models.WeeklyFeedback).filter(models.WeeklyFeedback.weekly_progress_id == l.id).first()
        res.append({
            "id": l.id,
            "week_number": l.week_number,
            "work_completed": l.work_completed,
            "objectives_achieved": l.objectives_achieved,
            "modules_completed": json.loads(l.modules_completed) if l.modules_completed.startswith("[") else l.modules_completed.split(","),
            "hours_worked": l.hours_worked,
            "current_progress": l.current_progress,
            "challenges_faced": l.challenges_faced,
            "next_week_plan": l.next_week_plan,
            "github_repo_link": l.github_repo_link,
            "live_demo_link": l.live_demo_link,
            "status": l.status,
            "created_at": l.created_at,
            "feedback": {
                "status": fb.status,
                "comments": fb.comments,
                "weekly_marks": fb.weekly_marks
            } if fb else None
        })
    return res

@router.get("/weekly/project/{project_id}")
def get_project_weekly_progress(project_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    teacher = get_teacher(payload, db)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.student.guide_id != teacher.id:
        raise HTTPException(status_code=403, detail="You are not authorized for this student's reviews")
        
    logs = db.query(models.WeeklyProgress).filter(
        models.WeeklyProgress.project_id == project.id
    ).order_by(models.WeeklyProgress.week_number.asc()).all()
    
    res = []
    for l in logs:
        fb = db.query(models.WeeklyFeedback).filter(models.WeeklyFeedback.weekly_progress_id == l.id).first()
        res.append({
            "id": l.id,
            "week_number": l.week_number,
            "work_completed": l.work_completed,
            "objectives_achieved": l.objectives_achieved,
            "modules_completed": l.modules_completed,
            "hours_worked": l.hours_worked,
            "current_progress": l.current_progress,
            "challenges_faced": l.challenges_faced,
            "next_week_plan": l.next_week_plan,
            "github_repo_link": l.github_repo_link,
            "live_demo_link": l.live_demo_link,
            "source_code_url": l.source_code_url,
            "videos_url": l.videos_url,
            "documents_url": l.documents_url,
            "database_backup_url": l.database_backup_url,
            "images_url": json.loads(l.images_url) if l.images_url and l.images_url.startswith("[") else [],
            "screenshots_url": json.loads(l.screenshots_url) if l.screenshots_url and l.screenshots_url.startswith("[") else [],
            "status": l.status,
            "created_at": l.created_at,
            "feedback": {
                "status": fb.status,
                "comments": fb.comments,
                "weekly_marks": fb.weekly_marks
            } if fb else None
        })
    return res

@router.post("/weekly/{id}/feedback")
def evaluate_weekly_progress(
    id: int,
    status: str = Form(...), # approved, rejected, revision_required
    comments: Optional[str] = Form(None),
    weekly_marks: int = Form(...), # out of 10
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    teacher = get_teacher(payload, db)
    log = db.query(models.WeeklyProgress).filter(models.WeeklyProgress.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
        
    if log.project.student.guide_id != teacher.id:
        raise HTTPException(status_code=403, detail="You are not authorized to grade this student")
        
    log.status = status
    
    feedback = db.query(models.WeeklyFeedback).filter(models.WeeklyFeedback.weekly_progress_id == log.id).first()
    if feedback:
        feedback.status = status
        feedback.comments = comments
        feedback.weekly_marks = weekly_marks
        feedback.reviewed_at = datetime.now()
    else:
        feedback = models.WeeklyFeedback(
            weekly_progress_id=log.id,
            status=status,
            comments=comments,
            weekly_marks=weekly_marks
        )
        db.add(feedback)
        
    # Log in WeeklyMarks cache
    wm = db.query(models.WeeklyMarks).filter(
        models.WeeklyMarks.project_id == log.project_id,
        models.WeeklyMarks.week_number == log.week_number
    ).first()
    if wm:
        wm.marks = weekly_marks
    else:
        wm = models.WeeklyMarks(
            project_id=log.project_id,
            week_number=log.week_number,
            marks=weekly_marks,
            max_marks=10
        )
        db.add(wm)
        
    # Update timeline milestone stages automatically
    if status == "approved":
        # Progress updates can automatically toggle milestone checklists
        if log.current_progress >= 20:
            m = db.query(models.ProjectMilestone).filter(models.ProjectMilestone.project_id == log.project_id, models.ProjectMilestone.name == "Requirement Analysis").first()
            if m: m.status = "completed"
        if log.current_progress >= 40:
            m = db.query(models.ProjectMilestone).filter(models.ProjectMilestone.project_id == log.project_id, models.ProjectMilestone.name == "Design Phase").first()
            if m: m.status = "completed"
        if log.current_progress >= 70:
            m = db.query(models.ProjectMilestone).filter(models.ProjectMilestone.project_id == log.project_id, models.ProjectMilestone.name == "Implementation").first()
            if m: m.status = "completed"
        if log.current_progress >= 85:
            m = db.query(models.ProjectMilestone).filter(models.ProjectMilestone.project_id == log.project_id, models.ProjectMilestone.name == "Testing Suite").first()
            if m: m.status = "completed"
            
    db.commit()
    
    # Notify student
    notif = models.Notification(
        user_id=log.project.student.user_id,
        title="Weekly Progress Feedback",
        message=f"Your guide {teacher.user.name} reviewed Week {log.week_number} progress. Status: {status.upper()}, Marks: {weekly_marks}/10.",
        notification_type="weekly_reviewed"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": "Feedback saved successfully"}

# --- WEEKLY MEETINGS MODULE ---

@router.post("/meetings/request")
def request_meeting(
    meeting_date: str = Form(...),
    time: str = Form(...),
    discussion: str = Form(...),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    student = get_student(payload, db)
    if not student.guide_id:
        raise HTTPException(status_code=400, detail="No guide allocated for meeting reviews")
        
    project = db.query(models.Project).filter(models.Project.student_id == student.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    meeting = models.MeetingSchedule(
        project_id=project.id,
        student_id=student.id,
        guide_id=student.guide_id,
        meeting_date=meeting_date,
        time=time,
        discussion=discussion,
        status="requested"
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Notify guide
    notif = models.Notification(
        user_id=student.guide.user_id,
        title="Meeting Request Received",
        message=f"Student {student.user.name} requested a sync meeting on {meeting_date} at {time}.",
        notification_type="meeting_requested"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": "Meeting request logged", "meeting_id": meeting.id}

@router.get("/meetings/my")
def get_my_meetings(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    role = payload.get("role")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if role == "student":
        meetings = db.query(models.MeetingSchedule).filter(models.MeetingSchedule.student_id == user.student_profile.id).all()
    elif role in ["teacher", "hod"]:
        meetings = db.query(models.MeetingSchedule).filter(models.MeetingSchedule.guide_id == user.teacher_profile.id).all()
    else:
        meetings = []
        
    res = []
    for m in meetings:
        res.append({
            "id": m.id,
            "student_name": m.student.user.name,
            "roll_number": m.student.roll_number,
            "guide_name": m.guide.user.name,
            "meeting_date": m.meeting_date,
            "time": m.time,
            "discussion": m.discussion,
            "action_items": m.action_items,
            "attendance": m.attendance,
            "status": m.status
        })
    return res

@router.post("/meetings/{id}/approve")
def approve_meeting(
    id: int,
    status: str = Form(...), # approved, completed, cancelled
    discussion: Optional[str] = Form(None),
    action_items: Optional[str] = Form(None),
    attendance: Optional[str] = Form(None), # JSON or comma-separated list
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    teacher = get_teacher(payload, db)
    meeting = db.query(models.MeetingSchedule).filter(models.MeetingSchedule.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting entry not found")
        
    if meeting.guide_id != teacher.id:
        raise HTTPException(status_code=403, detail="You are not authorized for this meeting review")
        
    meeting.status = status
    if discussion: meeting.discussion = discussion
    if action_items: meeting.action_items = action_items
    if attendance: meeting.attendance = attendance
    
    db.commit()
    
    # Notify student
    notif = models.Notification(
        user_id=meeting.student.user_id,
        title=f"Meeting Request {status.title()}",
        message=f"Meeting with guide {teacher.user.name} on {meeting.meeting_date} has been marked as {status.upper()}.",
        notification_type="meeting_approved"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": f"Meeting status updated to {status}"}

# --- FINAL SUBMISSIONS MODULE ---

@router.post("/final/submit")
def submit_final_report(
    github_repository: str = Form(...),
    deployment_link: str = Form(...),
    final_report: Optional[UploadFile] = File(None),
    research_paper: Optional[UploadFile] = File(None),
    ppt_file: Optional[UploadFile] = File(None),
    source_code_zip: Optional[UploadFile] = File(None),
    poster_file: Optional[UploadFile] = File(None),
    demo_video: Optional[UploadFile] = File(None),
    user_manual: Optional[UploadFile] = File(None),
    db_backup: Optional[UploadFile] = File(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    student = get_student(payload, db)
    project = db.query(models.Project).filter(models.Project.student_id == student.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Active project record not found")
        
    # Ensure all weekly logs/milestones are completed
    uncompleted_milestones = db.query(models.ProjectMilestone).filter(
        models.ProjectMilestone.project_id == project.id,
        models.ProjectMilestone.status == "pending",
        models.ProjectMilestone.name != "Documentation",
        models.ProjectMilestone.name != "Deployment",
        models.ProjectMilestone.name != "Final Submission"
    ).count()
    
    # Also verify there is at least one weekly progress log
    logged_weeks = db.query(models.WeeklyProgress).filter(models.WeeklyProgress.project_id == project.id).count()
    if logged_weeks == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Locked: You must submit weekly progress update logs before unlocking the Final Submission workspace."
        )
        
    if uncompleted_milestones > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Locked: Complete and obtain approval on all weekly progress updates and design milestones to unlock the Final Submission workspace."
        )
        
    rep_url = save_file(final_report, "final/reports")
    paper_url = save_file(research_paper, "final/papers")
    ppt_url = save_file(ppt_file, "final/ppt")
    zip_url = save_file(source_code_zip, "final/code")
    pos_url = save_file(poster_file, "final/posters")
    vid_url = save_file(demo_video, "final/videos")
    man_url = save_file(user_manual, "final/manuals")
    db_url = save_file(db_backup, "final/db")
    
    # Check if a report submission already exists
    report = db.query(models.ProjectReport).filter(models.ProjectReport.project_id == project.id).first()
    
    if report:
        report.github_repository = github_repository
        report.deployment_link = deployment_link
        report.submission_date = datetime.now()
        report.version += 1
        
        if rep_url: report.final_report_url = rep_url
        if paper_url: report.research_paper_url = paper_url
        if ppt_url: report.ppt_url = ppt_url
        if zip_url: report.source_code_zip_url = zip_url
        if pos_url: report.poster_url = pos_url
        if vid_url: report.demo_video_url = vid_url
        if man_url: report.user_manual_url = man_url
        if db_url: report.database_backup_url = db_url
    else:
        report = models.ProjectReport(
            project_id=project.id,
            github_repository=github_repository,
            deployment_link=deployment_link,
            final_report_url=rep_url,
            research_paper_url=paper_url,
            ppt_url=ppt_url,
            source_code_zip_url=zip_url,
            poster_url=pos_url,
            demo_video_url=vid_url,
            user_manual_url=man_url,
            database_backup_url=db_url,
            version=1
        )
        db.add(report)
        
    # Toggle milestones
    doc_milestone = db.query(models.ProjectMilestone).filter(
        models.ProjectMilestone.project_id == project.id,
        models.ProjectMilestone.name == "Documentation"
    ).first()
    if doc_milestone:
        doc_milestone.status = "completed"
        doc_milestone.progress_percentage = 100
        
    dep_milestone = db.query(models.ProjectMilestone).filter(
        models.ProjectMilestone.project_id == project.id,
        models.ProjectMilestone.name == "Deployment"
    ).first()
    if dep_milestone:
        dep_milestone.status = "completed"
        dep_milestone.progress_percentage = 100
        
    sub_milestone = db.query(models.ProjectMilestone).filter(
        models.ProjectMilestone.project_id == project.id,
        models.ProjectMilestone.name == "Final Submission"
    ).first()
    if sub_milestone:
        sub_milestone.status = "completed"
        sub_milestone.progress_percentage = 100
        
    db.commit()
    db.refresh(report)
    
    # Save project code credentials
    project.github_repo = github_repository
    project.live_url = deployment_link
    db.commit()
    
    # Notify guide
    if student.guide_id:
        notif = models.Notification(
            user_id=student.guide.user_id,
            title="Final Project Deliverables Submitted",
            message=f"Student {student.user.name} ({student.roll_number}) has uploaded their final report and source files.",
            notification_type="final_submitted"
        )
        db.add(notif)
        db.commit()
        
    return {"detail": "Final deliverables uploaded successfully", "report_id": report.id}

@router.get("/final/my")
def get_my_final_submission(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    student = get_student(payload, db)
    project = db.query(models.Project).filter(models.Project.student_id == student.id).first()
    if not project:
        return {"status": "none"}
        
    report = db.query(models.ProjectReport).filter(models.ProjectReport.project_id == project.id).first()
    if not report:
        return {"status": "none"}
    return report

@router.post("/final/evaluate")
def evaluate_final_project(
    project_id: int = Form(...),
    weekly_perf_marks: float = Form(...),   # Weight 30%
    proj_impl_marks: float = Form(...),     # Weight 25%
    final_report_marks: float = Form(...),   # Weight 20%
    research_paper_marks: float = Form(...), # Weight 15%
    viva_marks: float = Form(...),           # Weight 10%
    strengths: str = Form(...),
    weaknesses: str = Form(...),
    suggestions: str = Form(...),
    future_scope: str = Form(...),
    recommendation: str = Form(...),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    teacher = get_teacher(payload, db)
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.student.guide_id != teacher.id:
        raise HTTPException(status_code=403, detail="You are not authorized to grade this student")
        
    # Calculate weighted total marks
    total_marks = (
        (weekly_perf_marks) +
        (proj_impl_marks) +
        (final_report_marks) +
        (research_paper_marks) +
        (viva_marks)
    )
    
    # Auto grading thresholds
    if total_marks >= 90: grade = "A+"
    elif total_marks >= 80: grade = "A"
    elif total_marks >= 70: grade = "B"
    elif total_marks >= 60: grade = "C"
    elif total_marks >= 50: grade = "D"
    else: grade = "F"
    
    # Save FinalEvaluation
    eval_record = db.query(models.FinalEvaluation).filter(models.FinalEvaluation.project_id == project.id).first()
    if eval_record:
        eval_record.weekly_perf_marks = weekly_perf_marks
        eval_record.proj_impl_marks = proj_impl_marks
        eval_record.final_report_marks = final_report_marks
        eval_record.research_paper_marks = research_paper_marks
        eval_record.viva_marks = viva_marks
        eval_record.total_marks = total_marks
        eval_record.grade = grade
        eval_record.strengths = strengths
        eval_record.weaknesses = weaknesses
        eval_record.suggestions = suggestions
        eval_record.future_scope = future_scope
        eval_record.recommendation = recommendation
        eval_record.guide_approval = True
    else:
        eval_record = models.FinalEvaluation(
            project_id=project.id,
            weekly_perf_marks=weekly_perf_marks,
            proj_impl_marks=proj_impl_marks,
            final_report_marks=final_report_marks,
            research_paper_marks=research_paper_marks,
            viva_marks=viva_marks,
            total_marks=total_marks,
            grade=grade,
            strengths=strengths,
            weaknesses=weaknesses,
            suggestions=suggestions,
            future_scope=future_scope,
            recommendation=recommendation,
            guide_approval=True
        )
        db.add(eval_record)
        
    # Save GuideRemarks cache
    gr = models.GuideRemarks(
        project_id=project.id,
        remarks=recommendation
    )
    db.add(gr)
    
    # Save ProjectStatus summary
    ps = db.query(models.ProjectStatus).filter(models.ProjectStatus.project_id == project.id).first()
    if ps:
        ps.status = "completed"
        ps.grade = grade
        ps.total_marks = total_marks
        ps.guide_approved = True
    else:
        ps = models.ProjectStatus(
            project_id=project.id,
            status="completed",
            grade=grade,
            total_marks=total_marks,
            guide_approved=True
        )
        db.add(ps)
        
    # Lock project status to completed
    project.status = "completed"
    project.marks = int(total_marks)
    
    db.commit()
    
    # Notify student
    notif = models.Notification(
        user_id=project.student.user_id,
        title="Final Grades & Feedback Published",
        message=f"Congratulations! Your guide {teacher.user.name} published your final evaluation scorecard. Grade: {grade}, Marks: {total_marks:.1f}/100.",
        notification_type="marks_published"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": "Final evaluation metrics logged successfully", "total_marks": total_marks, "grade": grade}

@router.get("/evaluation/project/{project_id}")
def get_project_final_evaluation(project_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    role = payload.get("role")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if role == "student" and project.student_id != user.student_profile.id:
        raise HTTPException(status_code=403, detail="You do not own this project")
    elif role == "teacher" and project.student.guide_id != user.teacher_profile.id:
         raise HTTPException(status_code=403, detail="You are not authorized for this project evaluation")
         
    eval_rec = db.query(models.FinalEvaluation).filter(models.FinalEvaluation.project_id == project.id).first()
    if not eval_rec:
        return {"status": "pending_evaluation"}
    return eval_rec

# --- RESEARCH PAPER LIFE WORKSPACE ---

@router.post("/research-paper/upload")
def upload_research_paper(
    title: str = Form(...),
    abstract: str = Form(...),
    keywords: str = Form(...),
    conference: Optional[str] = Form(None),
    journal: Optional[str] = Form(None),
    paper: UploadFile = File(...),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    student = get_student(payload, db)
    project = db.query(models.Project).filter(models.Project.student_id == student.id).first()
    if not project:
         raise HTTPException(status_code=400, detail="Cannot upload paper without active project registration")
         
    paper_url = save_file(paper, "research_papers")
    
    # Save model
    rp = db.query(models.ResearchPapers).filter(
        models.ResearchPapers.project_id == project.id,
        models.ResearchPapers.student_id == student.id
    ).first()
    
    if rp:
        rp.title = title
        rp.abstract = abstract
        rp.keywords = keywords
        rp.conference = conference
        rp.journal = journal
        if paper_url: rp.paper_url = paper_url
        rp.status = "uploaded"
    else:
        rp = models.ResearchPapers(
            student_id=student.id,
            project_id=project.id,
            title=title,
            abstract=abstract,
            keywords=keywords,
            conference=conference,
            journal=journal,
            paper_url=paper_url,
            status="uploaded"
        )
        db.add(rp)
        
    db.commit()
    db.refresh(rp)
    
    # Add to standard ResearchPaper portfolio table
    legacy_rp = db.query(models.ResearchPaper).filter(
        models.ResearchPaper.student_id == student.id,
        models.ResearchPaper.title == title
    ).first()
    if not legacy_rp:
        legacy_rp = models.ResearchPaper(
            student_id=student.id,
            title=title,
            journal=journal or conference or "Target Forum",
            paper_url=paper_url,
            authors=f"{student.user.name}"
        )
        db.add(legacy_rp)
        db.commit()
        
    # Notify guide
    if student.guide_id:
        notif = models.Notification(
            user_id=student.guide.user_id,
            title="Research Paper Uploaded",
            message=f"Student {student.user.name} uploaded a research paper draft: '{title}'.",
            notification_type="paper_uploaded"
        )
        db.add(notif)
        db.commit()
        
    return {"detail": "Research paper registered successfully", "paper_id": rp.id}

@router.get("/research-paper/my")
def get_my_research_paper(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    student = get_student(payload, db)
    rp = db.query(models.ResearchPapers).filter(models.ResearchPapers.student_id == student.id).first()
    if not rp:
        return {"status": "none"}
    return rp

@router.post("/research-paper/{id}/action")
def evaluate_research_paper(
    id: int,
    status: str = Form(...), # approved, pending_review
    review_feedback: Optional[str] = Form(None),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    teacher = get_teacher(payload, db)
    rp = db.query(models.ResearchPapers).filter(models.ResearchPapers.id == id).first()
    if not rp:
        raise HTTPException(status_code=404, detail="Research paper draft not found")
        
    if rp.student.guide_id != teacher.id:
        raise HTTPException(status_code=403, detail="You are not authorized for this review")
        
    rp.status = status
    rp.review_feedback = review_feedback
    db.commit()
    
    # Notify student
    notif = models.Notification(
        user_id=rp.student.user_id,
        title=f"Research Paper Review Published",
        message=f"Your advisor guide {teacher.user.name} reviewed your paper. Status: {status.upper()}.",
        notification_type="paper_reviewed"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": f"Research paper marked as {status}"}

# --- AI LIFESTAGES DIAGNOSTIC SUITE ---

@router.post("/ai/review-paper")
def review_research_paper_ai(
    title: str = Form(...),
    abstract: str = Form(...),
    keywords: str = Form(...),
    journal_or_conf: str = Form(...),
    db: Session = Depends(get_db)
):
    review = AIService.review_research_paper_ai(title, abstract, keywords, journal_or_conf)
    return review

@router.post("/ai/review-report")
def review_project_report_ai(
    title: str = Form(...),
    objectives: str = Form(...),
    methodology: str = Form(...),
    results: str = Form(...),
    db: Session = Depends(get_db)
):
    review = AIService.review_project_report_ai(title, objectives, methodology, results)
    return review

# --- MOCK PLAGIARISM CHECKER ---

@router.post("/plagiarism/check")
def run_plagiarism_scan(
    project_id: int = Form(...),
    report_content: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Generate mock plagiarism stats
    import random
    similarity = round(random.uniform(5.0, 25.0), 2)
    ai_content = round(random.uniform(0.0, 15.0), 2)
    risk = "low"
    if similarity > 20:
        risk = "high"
    elif similarity > 15:
        risk = "medium"
        
    status = "acceptable" if similarity <= 20.0 else "high_risk"
    
    sources = [
        {"source": "IEEE Transactions on Systems Man & Cybernetics", "similarity": f"{round(similarity * 0.4, 2)}%"},
        {"source": "GitHub OpenSource Attendance Face Recognition Roster", "similarity": f"{round(similarity * 0.3, 2)}%"},
        {"source": "Medium Tech Blog OpenCV Node Tutorial", "similarity": f"{round(similarity * 0.2, 2)}%"}
    ]
    
    copied = [
        "In the existing systems, attendance is taken using traditional sign rosters, resulting in high proxy inputs.",
        "The proposed convolutional neural network maps facial vector checkpoints dynamically and logs timestamps."
    ]
    
    # Save PlagiarismReport
    report = models.PlagiarismReport(
        project_id=project.id,
        similarity_percentage=similarity,
        status=status,
        sources_json=json.dumps(sources),
        matched_paragraphs_json=json.dumps(copied),
        ai_content_percentage=ai_content,
        risk_level=risk,
        ai_summary="Plagiarism level lies within academic thresholds. Ensure IEEE citations are mapped to the final layout sections."
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report
