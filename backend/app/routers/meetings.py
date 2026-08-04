from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.db import get_db
from ..core.security import get_current_user_payload, RoleChecker
from ..models import models
from ..schemas import schemas

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

@router.get("", response_model=List[schemas.MeetingOut])
def get_user_meetings(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    """Retrieve scheduled meetings for the current user (Student or Teacher)"""
    role = payload.get("role")
    if role == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to view scheduled meetings.")

    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role == "student" and user.student_profile:
        return db.query(models.Meeting).filter(models.Meeting.student_id == user.student_profile.id).all()
    elif user.role == "teacher" and user.teacher_profile:
        return db.query(models.Meeting).filter(models.Meeting.created_by == user.id).all()
    elif user.role == "hod":
        return db.query(models.Meeting).all()
    return []

@router.post("", response_model=schemas.MeetingOut)
def schedule_meeting(
    meeting_in: schemas.MeetingCreate,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Schedules a new meeting (restricted to Student, Teachers, or HODs)"""
    role = payload.get("role")
    if role == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to schedule meetings.")
    if role not in ["teacher", "hod", "student"]:
        raise HTTPException(status_code=403, detail="Only students, teachers, or administrators can schedule meetings")
        
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check student exists
    student = db.query(models.Student).filter(models.Student.id == meeting_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Target student profile not found")
        
    # If student, verify they schedule for themselves
    if role == "student" and student.user_id != user.id:
        raise HTTPException(status_code=403, detail="Students can only schedule meetings for themselves")
        
    # Default meet URL mock generator
    join_url = meeting_in.join_url or f"https://meet.google.com/mock-{user.id}-{student.id}"
    
    db_meeting = models.Meeting(
        title=meeting_in.title,
        description=meeting_in.description,
        scheduled_at=meeting_in.scheduled_at,
        duration_minutes=meeting_in.duration_minutes,
        join_url=join_url,
        created_by=user.id,
        student_id=student.id
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # Notify appropriate person
    if role == "student":
        if student.guide:
            notif = models.Notification(
                user_id=student.guide.user_id,
                title="New Meeting Requested",
                message=f"Student {user.name} requested meeting '{meeting_in.title}' for {meeting_in.scheduled_at.strftime('%Y-%m-%d %H:%M')}.",
                notification_type="meeting"
            )
            db.add(notif)
            db.commit()
    else:
        notif = models.Notification(
            user_id=student.user_id,
            title="Meeting Scheduled",
            message=f"A new meeting '{meeting_in.title}' has been scheduled for {meeting_in.scheduled_at.strftime('%Y-%m-%d %H:%M')}.",
            notification_type="meeting"
        )
        db.add(notif)
        db.commit()
        
    return db_meeting

@router.put("/{meeting_id}/status")
def update_meeting_status(
    meeting_id: int,
    status: str,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    role = payload.get("role")
    if role == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to modify meeting status.")
    if status not in ["scheduled", "cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status option")
        
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    meeting.status = status
    db.commit()
    return {"detail": f"Meeting status updated to {status}"}
