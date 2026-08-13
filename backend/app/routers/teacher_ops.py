from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import json
from fastapi.responses import StreamingResponse
import io
import csv

from ..core.db import get_db
from ..core.security import RoleChecker, get_current_user_payload
from ..models import models
from ..schemas import schemas
from ..services.ai_service import AIService

router = APIRouter(
    prefix="/api/teachers/ops",
    tags=["teacher-operations"],
    dependencies=[Depends(RoleChecker(["teacher", "hod", "admin"]))]
)

def get_current_teacher(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)) -> models.Teacher:
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return user.teacher_profile

@router.get("/stats")
def get_teacher_stats(teacher: models.Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    # Assigned Students count
    students = db.query(models.Student).filter(models.Student.guide_id == teacher.id).all()
    student_ids = [s.id for s in students]
    assigned_students_count = len(students)

    # Project Groups count
    projects = db.query(models.Project).filter(models.Project.student_id.in_(student_ids)).all() if student_ids else []
    project_groups_count = len(projects)

    # Pending Abstract Reviews (projects in pending_review stage)
    pending_abstracts = sum(1 for p in projects if p.status == "pending_review")

    # Pending Reports (project files loaded with no report_review yet)
    # We can fetch project files where report reviews don't exist yet
    project_ids = [p.id for p in projects]
    files_count = db.query(models.ProjectFile).filter(models.ProjectFile.project_id.in_(project_ids)).count() if project_ids else 0
    pending_reports = max(0, files_count - (db.query(models.ReportReview).filter(models.ReportReview.project_id.in_(project_ids)).count() if project_ids else 0))

    # Pending Plagiarism Checks
    pending_plagiarism = sum(1 for p in projects if not db.query(models.PlagiarismReport).filter(models.PlagiarismReport.project_id == p.id).first())

    # Pending Feedback (number of progress updates with no weekly review yet)
    progress_update_ids = []
    for p in projects:
        for up in p.progress_updates:
            progress_update_ids.append(up.id)
    weekly_reviews_done = db.query(models.WeeklyReview).filter(models.WeeklyReview.progress_update_id.in_(progress_update_ids)).count() if progress_update_ids else 0
    pending_feedback = max(0, len(progress_update_ids) - weekly_reviews_done)

    # Completed Reviews
    completed_reviews = db.query(models.Feedback).filter(models.Feedback.teacher_id == teacher.id).count()

    # Upcoming meetings count
    upcoming_meetings = db.query(models.Meeting).filter(
        models.Meeting.student_id.in_(student_ids) if student_ids else False,
        models.Meeting.scheduled_at >= datetime.now()
    ).count()

    # Average progress
    total_prog = 0
    for p in projects:
        if p.progress_updates:
            total_prog += max(u.progress_percentage for u in p.progress_updates)
    avg_progress = Math.round(total_prog / len(projects)) if projects else 0

    return {
        "assigned_students": assigned_students_count,
        "project_groups": project_groups_count,
        "pending_abstracts": pending_abstracts,
        "pending_reports": pending_reports,
        "pending_plagiarism": pending_plagiarism,
        "pending_feedback": pending_feedback,
        "completed_reviews": completed_reviews,
        "upcoming_meetings": upcoming_meetings,
        "average_progress": avg_progress
    }

# Python helper to mimic JavaScript Math.round
class Math:
    @staticmethod
    def round(val):
        return int(val + 0.5) if val >= 0 else int(val - 0.5)

@router.put("/profile", response_model=schemas.TeacherOut)
def update_profile(
    profile_data: schemas.TeacherBase,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    teacher.designation = profile_data.designation
    teacher.employee_id = profile_data.employee_id
    teacher.qualification = profile_data.qualification
    teacher.research_area = profile_data.research_area
    teacher.phone = profile_data.phone
    teacher.office_location = profile_data.office_location
    teacher.office_hours = profile_data.office_hours
    if profile_data.profile_pic_url:
        teacher.profile_pic_url = profile_data.profile_pic_url
    db.commit()
    db.refresh(teacher)
    return teacher

@router.get("/students-tree")
def get_students_tree(teacher: models.Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    students = db.query(models.Student).filter(models.Student.guide_id == teacher.id).all()
    
    # Categorize hierarchically: Dept -> Year -> Section -> Group
    tree = {}
    for s in students:
        dept = s.department.name
        year_str = f"Year {s.year}"
        sec = f"Section {s.section}"
        
        proj_title = "Unallocated Project"
        proj_id = None
        status = "No Project"
        progress = 0
        if s.projects:
            proj = s.projects[0]
            proj_title = proj.title
            proj_id = proj.id
            status = proj.status
            if proj.progress_updates:
                progress = max(up.progress_percentage for up in proj.progress_updates)
                
        group_id = f"Group - {proj_title[:20]}"
        
        if dept not in tree:
            tree[dept] = {}
        if year_str not in tree[dept]:
            tree[dept][year_str] = {}
        if sec not in tree[dept][year_str]:
            tree[dept][year_str][sec] = {}
        if group_id not in tree[dept][year_str][sec]:
            tree[dept][year_str][sec][group_id] = []
            
        tree[dept][year_str][sec][group_id].append({
            "id": s.id,
            "name": s.user.name,
            "roll_number": s.roll_number,
            "reg_number": s.reg_number,
            "project_title": proj_title,
            "project_id": proj_id,
            "progress": progress,
            "guide": teacher.user.name,
            "status": status,
            "email": s.user.email,
            "mobile": s.mobile,
            "cgpa": s.cgpa,
            "skills": json.loads(s.skills) if s.skills else [],
            "semester": s.semester,
            "linkedin": s.linkedin,
            "github": s.github
        })
    return tree

@router.post("/allocate")
def allocate_project(
    allocation: schemas.ProjectCreate,
    student_id: int,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Check if student already has projects
    if student.projects:
        project = student.projects[0]
        project.title = allocation.title
        project.abstract = allocation.abstract
        project.description = allocation.description
        project.domain = allocation.domain
        project.category = allocation.category
        project.technologies = allocation.technologies
        project.difficulty_level = allocation.difficulty_level
    else:
        project = models.Project(
            title=allocation.title,
            abstract=allocation.abstract,
            description=allocation.description,
            domain=allocation.domain,
            category=allocation.category,
            technologies=allocation.technologies,
            difficulty_level=allocation.difficulty_level,
            student_id=student.id,
            status="approved"
        )
        db.add(project)
        
    # Add activity log for project allocation
    log = models.ActivityLog(
        user_id=teacher.user_id,
        action="PROJECT_ALLOCATION",
        details=f"Allocated project '{allocation.title}' to student {student.user.name} ({student.roll_number})."
    )
    db.add(log)
    db.commit()
    return {"detail": "Project allocated successfully"}

@router.post("/reassign-guide")
def reassign_guide(
    student_id: int,
    new_guide_id: int,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    old_guide_name = student.guide.user.name if student.guide else "None"
    student.guide_id = new_guide_id
    db.commit()
    
    new_guide = db.query(models.Teacher).filter(models.Teacher.id == new_guide_id).first()
    new_guide_name = new_guide.user.name if new_guide else "None"
    
    log = models.ActivityLog(
        user_id=teacher.user_id,
        action="GUIDE_REASSIGNMENT",
        details=f"Reassigned student {student.user.name} from Guide {old_guide_name} to {new_guide_name}."
    )
    db.add(log)
    db.commit()
    return {"detail": "Guide reassigned successfully"}

@router.get("/allocation/history")
def get_allocation_history(db: Session = Depends(get_db)):
    logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.action.in_(["PROJECT_ALLOCATION", "GUIDE_REASSIGNMENT"])
    ).order_by(models.ActivityLog.timestamp.desc()).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

# Abstract evaluations
@router.post("/abstract/review")
def review_abstract(
    project_id: int,
    review_data: schemas.AbstractReviewEvaluate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project.status = review_data.status
    if review_data.status == "approved":
        project.marks = review_data.marks
        
    # Version count
    v_count = db.query(models.AbstractReview).filter(models.AbstractReview.project_id == project_id).count() + 1
    
    review = models.AbstractReview(
        project_id=project_id,
        status=review_data.status,
        marks=review_data.marks,
        remarks=review_data.remarks,
        abstract_text=project.abstract,
        version=v_count
    )
    db.add(review)
    db.commit()
    return {"detail": "Abstract review submitted"}

# AI evaluation of abstracts
@router.post("/abstract/evaluate-ai")
def evaluate_abstract_ai(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    eval_res = AIService.evaluate_abstract_ai(project.title, project.abstract or "")
    
    # Save review to DB
    ai_rev = models.AIReview(
        project_id=project_id,
        review_type="abstract",
        quality_metrics_json=json.dumps(eval_res),
        suggestions=", ".join(eval_res.get("suggestions", [])),
        original_text=project.abstract
    )
    db.add(ai_rev)
    db.commit()
    return eval_res

# Synopsis Reviews
@router.post("/synopsis/review")
def review_synopsis(
    review_data: schemas.SynopsisReviewCreate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    syn_review = models.SynopsisReview(
        project_id=review_data.project_id,
        status=review_data.status,
        problem_statement=review_data.problem_statement,
        objectives=review_data.objectives,
        literature_survey=review_data.literature_survey,
        proposed_methodology=review_data.proposed_methodology,
        expected_outcomes=review_data.expected_outcomes,
        remarks=review_data.remarks
    )
    db.add(syn_review)
    
    project = db.query(models.Project).filter(models.Project.id == review_data.project_id).first()
    if project:
        project.status = review_data.status
        
    db.commit()
    return {"detail": "Synopsis review submitted"}

# Weekly Progress approvals
@router.post("/weekly/review")
def review_weekly_progress(
    review_data: schemas.WeeklyReviewCreate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    update = db.query(models.ProgressUpdate).filter(models.ProgressUpdate.id == review_data.progress_update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Progress update not found")
        
    weekly_review = models.WeeklyReview(
        progress_update_id=review_data.progress_update_id,
        status=review_data.status,
        feedback=review_data.feedback
    )
    db.add(weekly_review)
    db.commit()
    return {"detail": "Weekly progress review submitted"}

# Report evaluations
@router.post("/report/review")
def review_report(
    review_data: schemas.ReportReviewCreate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    # Versioning
    v_count = db.query(models.ReportReview).filter(
        models.ReportReview.project_id == review_data.project_id,
        models.ReportReview.report_type == review_data.report_type
    ).count() + 1
    
    review = models.ReportReview(
        project_id=review_data.project_id,
        report_type=review_data.report_type,
        status=review_data.status,
        feedback=review_data.feedback,
        annotations=review_data.annotations,
        version=v_count
    )
    db.add(review)
    db.commit()
    return {"detail": f"{review_data.report_type.upper()} report review submitted successfully"}

@router.post("/report/evaluate-ai")
def evaluate_report_ai(project_id: int, report_type: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    content = project.description or "Mock project descriptions containing SRS scope definitions."
    eval_res = AIService.evaluate_report_ai(project.title, report_type, content)
    
    # Save review to DB
    ai_rev = models.AIReview(
        project_id=project_id,
        review_type="report",
        quality_metrics_json=json.dumps(eval_res),
        suggestions=eval_res.get("suggestions", ""),
        original_text=content
    )
    db.add(ai_rev)
    db.commit()
    return eval_res

# Plagiarism reports
@router.post("/plagiarism/check")
def check_plagiarism(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Perform mock plagiarism check
    import random
    sim_percent = round(random.uniform(5.0, 35.0), 2)
    ai_percent = round(random.uniform(2.0, 45.0), 2)
    risk = "low"
    status = "acceptable"
    if sim_percent > 20.0:
        risk = "high"
        status = "high_risk"
    elif sim_percent > 12.0:
        risk = "medium"
        status = "pending_review"
        
    sources = ["IEEE Transactions Journal", "GitHub repository /opensource-app", "ArXiv preprint archives"]
    matches = ["Database models and user authentication layouts match open-source blueprints.", "Literal descriptions of facial convolution filters found in reference documents."]
    
    ai_expl = AIService.explain_plagiarism_ai(sim_percent, ", ".join(sources))
    
    # Create Plagiarism Report record
    plag = models.PlagiarismReport(
        project_id=project_id,
        similarity_percentage=sim_percent,
        status=status,
        sources_json=json.dumps(sources),
        matched_paragraphs_json=json.dumps(matches),
        ai_content_percentage=ai_percent,
        risk_level=risk,
        ai_summary=ai_expl.get("sections_similar", "") + " " + ai_expl.get("acceptability", "")
    )
    db.add(plag)
    db.commit()
    db.refresh(plag)
    
    return {
        "id": plag.id,
        "similarity_percentage": plag.similarity_percentage,
        "status": plag.status,
        "sources": sources,
        "matched_paragraphs": matches,
        "ai_content_percentage": plag.ai_content_percentage,
        "risk_level": plag.risk_level,
        "ai_summary": plag.ai_summary,
        "suggestions": ai_expl.get("suggestions", [])
    }

# Viva mark sheets
@router.post("/viva/evaluate")
def evaluate_viva(
    viva_data: schemas.VivaMarkCreate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    viva = models.VivaMark(
        student_id=viva_data.student_id,
        project_id=viva_data.project_id,
        questions_asked=viva_data.questions_asked,
        student_answers=viva_data.student_answers,
        marks=viva_data.marks,
        remarks=viva_data.remarks,
        audio_url=viva_data.audio_url
    )
    db.add(viva)
    db.commit()
    return {"detail": "Viva evaluation logged"}

# Rubrics
@router.post("/rubrics/evaluate")
def evaluate_rubric(
    rubric_data: schemas.RubricCreate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    rubric = models.Rubric(
        project_id=rubric_data.project_id,
        student_id=rubric_data.student_id,
        problem_definition=rubric_data.problem_definition,
        literature_survey=rubric_data.literature_survey,
        innovation=rubric_data.innovation,
        design=rubric_data.design,
        coding=rubric_data.coding,
        testing=rubric_data.testing,
        documentation=rubric_data.documentation,
        presentation=rubric_data.presentation,
        viva=rubric_data.viva,
        total_marks=rubric_data.total_marks,
        rubrics_json=rubric_data.rubrics_json,
        remarks=rubric_data.remarks
    )
    db.add(rubric)
    db.commit()
    
    # Also update project marks using total rubric marks scaled to percentage (out of 100)
    project = db.query(models.Project).filter(models.Project.id == rubric_data.project_id).first()
    if project:
        # Scale sessional marks (out of 150) to a percentage (out of 100)
        project.marks = round((rubric.total_marks / 150.0) * 100.0)
        db.commit()
        
    return {"detail": "Rubric evaluation marks calculated and logged"}

@router.post("/rubrics/recommend-ai")
def recommend_rubric_marks_ai(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    criteria = {
        "problem_definition": 10,
        "literature_survey": 10,
        "innovation": 10,
        "design": 10,
        "coding": 10,
        "testing": 10,
        "documentation": 10,
        "presentation": 10,
        "viva": 10
    }
    eval_res = AIService.recommend_marks_ai(project.title, criteria)
    return eval_res

# Export Report Endpoints
@router.get("/export")
def export_teacher_report(
    report_type: str, # marks, students, progress
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    students = db.query(models.Student).filter(models.Student.guide_id == teacher.id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "marks":
        writer.writerow(["Student Roll", "Name", "Project Title", "Total Rubric Marks", "Innovative score", "Design score", "Coding score", "Presentation"])
        for s in students:
            proj = s.projects[0] if s.projects else None
            rubric = db.query(models.Rubric).filter(models.Rubric.student_id == s.id).first()
            if rubric and proj:
                writer.writerow([s.roll_number, s.user.name, proj.title, rubric.total_marks, rubric.innovation, rubric.design, rubric.coding, rubric.presentation])
            elif proj:
                writer.writerow([s.roll_number, s.user.name, proj.title, "N/A", "N/A", "N/A", "N/A", "N/A"])
                
    elif report_type == "students":
        writer.writerow(["Student Roll", "Name", "Email", "Department", "Semester", "CGPA", "Skills"])
        for s in students:
            writer.writerow([s.roll_number, s.user.name, s.user.email, s.department.name, s.semester, s.cgpa, s.skills or "[]"])
            
    else: # progress
        writer.writerow(["Student Roll", "Name", "Project Title", "Completion Percentage", "Latest Update"])
        for s in students:
            proj = s.projects[0] if s.projects else None
            if proj:
                progress = max([u.progress_percentage for u in proj.progress_updates]) if proj.progress_updates else 0
                latest_update = proj.progress_updates[-1].work_done if proj.progress_updates else "None"
                writer.writerow([s.roll_number, s.user.name, proj.title, f"{progress}%", latest_update])
                
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="Teacher_{report_type}_report_{datetime.now().strftime("%Y%m%d")}.csv"'
    }
    return StreamingResponse(io.BytesIO(output.read().encode("utf-8")), media_type="text/csv", headers=headers)
