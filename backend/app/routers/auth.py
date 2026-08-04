from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any
from ..core.db import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, get_current_user_payload
from ..models import models
from ..schemas import schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Any:
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
        
    access_token = create_access_token(subject=user.email, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.post("/register/student", response_model=schemas.StudentOut)
def register_student(student_in: schemas.StudentCreate, db: Session = Depends(get_db)) -> Any:
    # Check email
    existing_user = db.query(models.User).filter(models.User.email == student_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
        
    # Check Roll numbers
    if db.query(models.Student).filter(models.Student.roll_number == student_in.roll_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number already registered",
        )

    # Create User
    hashed_pwd = get_password_hash(student_in.password)
    user = models.User(
        name=student_in.name,
        email=student_in.email,
        hashed_password=hashed_pwd,
        role="student"
    )
    db.add(user)
    db.flush() # populate user.id
    
    # Create Student
    student = models.Student(
        user_id=user.id,
        roll_number=student_in.roll_number,
        reg_number=student_in.reg_number,
        univ_roll_number=student_in.univ_roll_number,
        mobile=student_in.mobile,
        department_id=student_in.department_id,
        year=student_in.year,
        semester=student_in.semester,
        section=student_in.section,
        batch=student_in.batch,
        skills=student_in.skills,
        linkedin=student_in.linkedin,
        github=student_in.github,
        resume_url=student_in.resume_url,
        profile_pic_url=student_in.profile_pic_url,
        guide_id=student_in.guide_id
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.post("/register/teacher", response_model=schemas.TeacherOut)
def register_teacher(teacher_in: schemas.TeacherCreate, db: Session = Depends(get_db)) -> Any:
    existing_user = db.query(models.User).filter(models.User.email == teacher_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create User
    hashed_pwd = get_password_hash(teacher_in.password)
    user = models.User(
        name=teacher_in.name,
        email=teacher_in.email,
        hashed_password=hashed_pwd,
        role="teacher"
    )
    db.add(user)
    db.flush()
    
    # Create Teacher
    teacher = models.Teacher(
        user_id=user.id,
        department_id=teacher_in.department_id,
        designation=teacher_in.designation
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@router.get("/me")
def get_current_user_profile(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)) -> Any:
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    res = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }
    
    if user.role == "student" and user.student_profile:
        s = user.student_profile
        res["student_profile"] = {
            "id": s.id,
            "roll_number": s.roll_number,
            "reg_number": s.reg_number,
            "univ_roll_number": s.univ_roll_number,
            "mobile": s.mobile,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else "",
            "year": s.year,
            "semester": s.semester,
            "section": s.section,
            "batch": s.batch,
            "skills": s.skills,
            "linkedin": s.linkedin,
            "github": s.github,
            "resume_url": s.resume_url,
            "profile_pic_url": s.profile_pic_url,
            "guide_id": s.guide_id,
            "guide_name": s.guide.user.name if s.guide else None,
            "guide_user_id": s.guide.user_id if s.guide else None,
            "gender": s.gender,
            "date_of_birth": s.date_of_birth,
            "address": s.address,
            "college": s.college,
            "program": s.program,
            "class_name": s.class_name,
            "admission_year": s.admission_year,
            "cgpa": s.cgpa
        }
    elif user.role == "teacher" and user.teacher_profile:
        t = user.teacher_profile
        res["teacher_profile"] = {
            "id": t.id,
            "department_id": t.department_id,
            "department_name": t.department.name if t.department else "",
            "designation": t.designation
        }
    return res

@router.post("/change-password")
def change_password(
    pwd_in: schemas.ChangePassword,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(pwd_in.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    user.hashed_password = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}

@router.put("/student/profile")
def update_student_profile(
    student_in: schemas.StudentUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can update student profile details")
        
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    student = user.student_profile
    if student_in.name is not None:
        user.name = student_in.name
        
    for field, val in student_in.model_dump(exclude_unset=True).items():
        if field != "name":
            setattr(student, field, val)
        
    db.commit()
    db.refresh(student)
    db.refresh(user)
    return {"detail": "Profile updated successfully"}
