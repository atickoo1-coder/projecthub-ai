from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.db import get_db
from ..core.security import get_current_user_payload, RoleChecker
from ..models import models
from ..schemas import schemas
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/teachers", tags=["teachers"], dependencies=[Depends(RoleChecker(["teacher", "hod", "admin"]))])

def get_current_teacher(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)) -> models.Teacher:
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return user.teacher_profile

@router.get("/students", response_model=List[schemas.StudentOut])
def get_assigned_students(teacher: models.Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """Retrieve students assigned to the current teacher/guide"""
    return db.query(models.Student).filter(models.Student.guide_id == teacher.id).all()

@router.get("/projects/pending", response_model=List[schemas.ProjectOut])
def get_pending_projects(teacher: models.Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """Retrieve projects pending evaluation from assigned students"""
    return db.query(models.Project).join(models.Student).filter(
        models.Student.guide_id == teacher.id,
        models.Project.status == "pending_review"
    ).all()

@router.post("/projects/{project_id}/feedback", response_model=schemas.FeedbackOut)
def give_project_feedback(
    project_id: int,
    feedback_in: schemas.FeedbackCreate,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.student.guide_id != teacher.id and teacher.user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized to give feedback for this project")
        
    feedback = models.Feedback(
        project_id=project_id,
        teacher_id=teacher.id,
        rating=feedback_in.rating,
        comments=feedback_in.comments,
        positive_points=feedback_in.positive_points,
        areas_of_improvement=feedback_in.areas_of_improvement,
        recommendations=feedback_in.recommendations
    )
    db.add(feedback)
    
    # Also update marks if rating is supplied
    if feedback_in.rating is not None:
        project.marks = feedback_in.rating
        
    db.commit()
    db.refresh(feedback)
    
    # Send email notification
    student_user = project.student.user
    EmailService.send_feedback_notification(
        to_email=student_user.email,
        student_name=student_user.name,
        project_title=project.title,
        teacher_name=teacher.user.name
    )
    
    # Add dashboard notification
    notif = models.Notification(
        user_id=student_user.id,
        title="Feedback Received",
        message=f"Prof. {teacher.user.name} reviewed your project '{project.title}' and submitted feedback.",
        notification_type="feedback"
    )
    db.add(notif)
    db.commit()
    
    return feedback

@router.put("/projects/{project_id}/status")
def review_project_status(
    project_id: int,
    status: str,
    teacher: models.Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    if status not in ["approved", "revision_requested", "completed", "pending_review"]:
        raise HTTPException(status_code=400, detail="Invalid status option")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.student.guide_id != teacher.id and teacher.user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized to edit this project status")
        
    project.status = status
    db.commit()
    
    student_user = project.student.user
    # Notify student
    if status == "approved":
        EmailService.send_approval_notification(student_user.email, student_user.name, project.title)
        
    notif = models.Notification(
        user_id=student_user.id,
        title=f"Project Status: {status.replace('_', ' ').capitalize()}",
        message=f"Your project '{project.title}' status has been updated to {status.replace('_', ' ').capitalize()}.",
        notification_type="approval"
    )
    db.add(notif)
    db.commit()
    
    return {"detail": f"Project status updated successfully to {status}"}
