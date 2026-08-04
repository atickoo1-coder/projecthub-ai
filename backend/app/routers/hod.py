from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..core.db import get_db
from ..core.security import get_current_user_payload, RoleChecker
from ..models import models
from ..schemas import schemas

router = APIRouter(prefix="/api/hod", tags=["hod"], dependencies=[Depends(RoleChecker(["hod", "admin"]))])

def get_current_hod_dept(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)) -> int:
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="HOD user profile not found")
    if user.role == "admin":
        return 1 # Fallback department ID for testing/admin
    if not user.teacher_profile:
        raise HTTPException(status_code=404, detail="HOD teacher profile not found")
    return user.teacher_profile.department_id

@router.get("/analytics")
def get_department_analytics(
    dept_id: Optional[int] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Provides analytical breakdown of department projects, guides, and status distributions"""
    if dept_id is None:
        dept_id = get_current_hod_dept(payload, db)
    total_students = db.query(models.Student).filter(models.Student.department_id == dept_id).count()
    total_teachers = db.query(models.Teacher).filter(models.Teacher.department_id == dept_id).count()
    
    # Projects statuses breakdown
    status_counts = db.query(
        models.Project.status, func.count(models.Project.id)
    ).join(models.Student).filter(models.Student.department_id == dept_id).group_by(models.Project.status).all()
    
    status_dict = {"pending_review": 0, "approved": 0, "revision_requested": 0, "completed": 0}
    for status_name, cnt in status_counts:
        if status_name in status_dict:
            status_dict[status_name] = cnt
            
    # Domain breakdown
    domain_counts = db.query(
        models.Project.domain, func.count(models.Project.id)
    ).join(models.Student).filter(models.Student.department_id == dept_id).group_by(models.Project.domain).all()
    
    domains_list = [{"domain": dom or "Unassigned", "count": count} for dom, count in domain_counts]
    
    # Projects per guide breakdown
    guide_counts = db.query(
        models.User.name, func.count(models.Project.id)
    ).select_from(models.Project).join(models.Student).join(models.Teacher, models.Student.guide_id == models.Teacher.id).join(models.User, models.Teacher.user_id == models.User.id).filter(models.Student.department_id == dept_id).group_by(models.User.name).all()
    
    guides_list = [{"guide_name": name, "projects_count": count} for name, count in guide_counts]
    
    # Year-wise project count
    year_counts = db.query(
        models.Student.year, func.count(models.Project.id)
    ).join(models.Project).filter(models.Student.department_id == dept_id).group_by(models.Student.year).all()
    
    year_list = [{"year": year, "count": count} for year, count in year_counts]

    return {
        "department_id": dept_id,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "status_distribution": status_dict,
        "domain_distribution": domains_list,
        "guide_distribution": guides_list,
        "year_distribution": year_list
    }

@router.get("/students")
def get_department_students(
    year: Optional[int] = None,
    section: Optional[str] = None,
    guide_id: Optional[int] = None,
    dept_id: Optional[int] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    if dept_id is None:
        dept_id = get_current_hod_dept(payload, db)
    query = db.query(models.Student).filter(models.Student.department_id == dept_id)
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section)
    if guide_id:
        query = query.filter(models.Student.guide_id == guide_id)
    students = query.all()
    
    res = []
    for s in students:
        proj_count = len(s.projects)
        completed_count = sum(1 for p in s.projects if p.status == "completed")
        res.append({
            "id": s.id,
            "name": s.user.name,
            "roll_number": s.roll_number,
            "year": s.year,
            "semester": s.semester,
            "section": s.section,
            "guide_name": s.guide.user.name if s.guide else "Unassigned",
            "projects_count": proj_count,
            "completed_projects": completed_count
        })
    return res
