from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..core.db import get_db
from ..core.security import get_current_user_payload, RoleChecker
from ..models import models
from ..schemas import schemas

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(RoleChecker(["admin"]))])

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """Provides broad ERP analytics for the primary Admin Dashboard"""
    total_students = db.query(models.Student).count()
    total_teachers = db.query(models.Teacher).count()
    total_projects = db.query(models.Project).count()
    
    pending_reviews = db.query(models.Project).filter(models.Project.status == "pending_review").count()
    approved = db.query(models.Project).filter(models.Project.status == "approved").count()
    completed = db.query(models.Project).filter(models.Project.status == "completed").count()
    revisions = db.query(models.Project).filter(models.Project.status == "revision_requested").count()
    
    # Department-wise counts
    dept_stats = db.query(
        models.Department.name, func.count(models.Student.id)
    ).outerjoin(models.Student).group_by(models.Department.name).all()
    
    dept_list = [{"department": name, "students_count": count} for name, count in dept_stats]
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_projects": total_projects,
        "status_distribution": {
            "pending_review": pending_reviews,
            "approved": approved,
            "completed": completed,
            "revision_requested": revisions
        },
        "department_distribution": dept_list
    }

@router.post("/departments", response_model=schemas.DepartmentOut)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = db.query(models.Department).filter(models.Department.code == dept.code).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department with this code already exists")
    db_dept = models.Department(name=dept.name, code=dept.code)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/departments", response_model=List[schemas.DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check dependencies
    has_students = db.query(models.Student).filter(models.Student.department_id == dept_id).first()
    has_teachers = db.query(models.Teacher).filter(models.Teacher.department_id == dept_id).first()
    if has_students or has_teachers:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete department. There are active students or teachers enrolled. Reassign them first."
        )
        
    db.delete(dept)
    db.commit()
    return {"detail": "Department deleted successfully"}

@router.post("/announcements", response_model=schemas.AnnouncementOut)
def create_announcement(ann: schemas.AnnouncementCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    db_ann = models.Announcement(
        title=ann.title,
        content=ann.content,
        target_audience=ann.target_audience,
        created_by=user.id
    )
    db.add(db_ann)
    db.commit()
    db.refresh(db_ann)
    return db_ann

@router.get("/announcements", response_model=List[schemas.AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@router.put("/users/{user_id}/status")
def toggle_user_active(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    return {"detail": f"User active status set to {is_active}"}

@router.get("/students")
def list_all_students(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Student)
    if search:
        query = query.join(models.User).filter(
            (models.User.name.ilike(f"%{search}%")) | 
            (models.Student.roll_number.ilike(f"%{search}%"))
        )
    students = query.all()
    res = []
    for s in students:
        res.append({
            "id": s.id,
            "name": s.user.name,
            "email": s.user.email,
            "roll_number": s.roll_number,
            "department_name": s.department.name if s.department else "Unassigned",
            "year": s.year,
            "semester": s.semester,
            "section": s.section,
            "guide_name": s.guide.user.name if s.guide else "Unassigned"
        })
    return res

@router.post("/students", response_model=schemas.StudentOut)
def create_student(student_in: schemas.StudentCreate, db: Session = Depends(get_db)):
    # Check Email
    existing_user = db.query(models.User).filter(models.User.email == student_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Check Roll
    existing_roll = db.query(models.Student).filter(models.Student.roll_number == student_in.roll_number).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll number already registered")
        
    # Create User
    from ..core.security import get_password_hash
    hashed_pwd = get_password_hash(student_in.password)
    user = models.User(
        name=student_in.name,
        email=student_in.email,
        hashed_password=hashed_pwd,
        role="student"
    )
    db.add(user)
    db.flush()
    
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

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Delete the user record. Foreign Key cascade deletes the student and all linked records.
    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    if user:
        db.delete(user)
    else:
        db.delete(student)
        
    db.commit()
    return {"detail": "Student deleted successfully"}

@router.get("/teachers")
def list_all_teachers(db: Session = Depends(get_db)):
    teachers = db.query(models.Teacher).all()
    res = []
    for t in teachers:
        res.append({
            "id": t.id,
            "name": t.user.name,
            "email": t.user.email,
            "department_name": t.department.name if t.department else "Unassigned",
            "designation": t.designation
        })
    return res

@router.put("/students/{student_id}/guide")
def allocate_guide(student_id: int, guide_id: Optional[int] = None, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if guide_id is not None:
        teacher = db.query(models.Teacher).filter(models.Teacher.id == guide_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        student.guide_id = teacher.id
    else:
        student.guide_id = None
        
    db.commit()
    return {"detail": "Guide allocated successfully"}

@router.get("/projects")
def list_all_projects(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Project)
    if status:
        query = query.filter(models.Project.status == status)
    projects = query.all()
    res = []
    for p in projects:
        res.append({
            "id": p.id,
            "title": p.title,
            "domain": p.domain,
            "category": p.category,
            "difficulty_level": p.difficulty_level,
            "status": p.status,
            "student_name": p.student.user.name if p.student else "Unknown",
            "student_roll": p.student.roll_number if p.student else "",
            "student_id": p.student.id if p.student else None,
            "guide_name": p.student.guide.user.name if p.student and p.student.guide else "Unassigned",
            "group_members": p.group_members
        })
    return res

@router.put("/projects/{project_id}")
def admin_update_project(project_id: int, project_in: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    for field, val in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, val)
        
    db.commit()
    db.refresh(project)
    return project

