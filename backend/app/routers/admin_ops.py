from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import io
import csv
import openpyxl
from ..core.db import get_db
from ..core.security import RoleChecker, get_current_user_payload, get_password_hash
from ..models import models
from ..schemas import schemas
from fastapi.responses import StreamingResponse
import json

router = APIRouter(prefix="/api/admin/ops", tags=["admin_ops"], dependencies=[Depends(RoleChecker(["admin"]))])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Summary metrics for the Admin Dashboard"""
    total_students = db.query(models.Student).filter(models.Student.is_deleted == False).count()
    total_teachers = db.query(models.Teacher).count()
    
    # Guides are teachers who have at least one assigned student or a guide workload capacity set
    total_guides = db.query(models.Teacher).filter(
        models.Teacher.students.any() | 
        db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == models.Teacher.id).exists()
    ).count()
    
    total_depts = db.query(models.Department).count()
    total_classes = db.query(models.Class).count()
    total_sections = db.query(models.Section).count()
    total_projects = db.query(models.Project).count()
    
    guide_allocations_pending = db.query(models.Student).filter(
        models.Student.is_deleted == False,
        models.Student.guide_id == None
    ).count()
    
    active_projects = db.query(models.Project).filter(
        models.Project.status.in_(["approved", "in_progress"])
    ).count()
    
    completed_projects = db.query(models.Project).filter(
        models.Project.status == "completed"
    ).count()

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_guides": total_guides,
        "total_departments": total_depts,
        "total_classes": total_classes,
        "total_sections": total_sections,
        "total_projects": total_projects,
        "guide_allocations_pending": guide_allocations_pending,
        "active_projects": active_projects,
        "completed_projects": completed_projects
    }

@router.get("/charts")
def get_analytics_charts(db: Session = Depends(get_db)):
    """Analytics datasets for ChartJS charts"""
    # 1. Students Department-wise
    dept_counts = db.query(
        models.Department.code,
        func.count(models.Student.id)
    ).join(models.Student).filter(models.Student.is_deleted == False).group_by(models.Department.code).all()
    
    students_dept = [{"label": code, "value": count} for code, count in dept_counts]

    # 2. Students Year-wise
    year_counts = db.query(
        models.Student.year,
        func.count(models.Student.id)
    ).filter(models.Student.is_deleted == False).group_by(models.Student.year).all()
    
    students_year = [{"label": f"Year {year}", "value": count} for year, count in year_counts]

    # 3. Guide Workload
    teachers = db.query(models.Teacher).all()
    workload_data = []
    for t in teachers:
        assigned = db.query(models.Student).filter(models.Student.guide_id == t.id, models.Student.is_deleted == False).count()
        wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == t.id).first()
        capacity = wl.max_capacity if wl else 20
        workload_data.append({
            "guide": t.user.name,
            "assigned": assigned,
            "capacity": capacity
        })

    # 4. Project Status
    status_counts = db.query(
        models.Project.status,
        func.count(models.Project.id)
    ).group_by(models.Project.status).all()
    
    project_status = [{"label": status or "pending", "value": count} for status, count in status_counts]

    # 5. Department-wise Projects
    dept_proj_counts = db.query(
        models.Department.code,
        func.count(models.Project.id)
    ).join(models.Student, models.Student.id == models.Project.student_id)\
     .join(models.Department, models.Department.id == models.Student.department_id)\
     .group_by(models.Department.code).all()
     
    dept_projects = [{"label": code, "value": count} for code, count in dept_proj_counts]

    return {
        "students_department": students_dept,
        "students_year": students_year,
        "guide_workload": workload_data,
        "project_status": project_status,
        "department_projects": dept_projects
    }

@router.get("/students")
def get_students_directory(
    search: Optional[str] = None,
    year: Optional[int] = None,
    department_id: Optional[int] = None,
    section: Optional[str] = None,
    class_name: Optional[str] = None,
    guide_id: Optional[int] = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(models.Student)
    
    if not include_deleted:
        query = query.filter(models.Student.is_deleted == False)
        
    if search:
        query = query.join(models.User).filter(
            (models.User.name.ilike(f"%{search}%")) |
            (models.Student.roll_number.ilike(f"%{search}%")) |
            (models.Student.reg_number.ilike(f"%{search}%"))
        )
        
    if year:
        query = query.filter(models.Student.year == year)
    if department_id:
        query = query.filter(models.Student.department_id == department_id)
    if section:
        query = query.filter(models.Student.section.ilike(section))
    if class_name:
        query = query.filter(models.Student.class_name.ilike(class_name))
    if guide_id:
        query = query.filter(models.Student.guide_id == guide_id)
        
    students = query.all()
    
    res = []
    for s in students:
        proj = db.query(models.Project).filter(models.Project.student_id == s.id).first()
        res.append({
            "id": s.id,
            "name": s.user.name,
            "email": s.user.email,
            "roll_number": s.roll_number,
            "reg_number": s.reg_number,
            "univ_roll_number": s.univ_roll_number,
            "mobile": s.mobile,
            "department_id": s.department_id,
            "department_name": s.department.name if s.department else "Unassigned",
            "year": s.year,
            "semester": s.semester,
            "section": s.section,
            "class_name": s.class_name,
            "batch": s.batch,
            "program": s.program,
            "admission_year": s.admission_year,
            "cgpa": s.cgpa,
            "is_deleted": s.is_deleted,
            "guide_id": s.guide_id,
            "guide_name": s.guide.user.name if s.guide else "Unassigned",
            "project_title": proj.title if proj else "No Project",
            "project_progress": proj.progress_percentage if proj else 0,
            "project_status": proj.status if proj else "N/A"
        })
    return res

@router.post("/students")
def create_student_manual(student_in: schemas.StudentCreate, db: Session = Depends(get_db)):
    # Check email and roll
    existing_user = db.query(models.User).filter(models.User.email == student_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_roll = db.query(models.Student).filter(models.Student.roll_number == student_in.roll_number).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll number already registered")

    # Create User
    db_user = models.User(
        name=student_in.name,
        email=student_in.email,
        hashed_password=get_password_hash(student_in.password),
        role="student",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create Student
    db_student = models.Student(
        user_id=db_user.id,
        roll_number=student_in.roll_number,
        reg_number=student_in.reg_number,
        univ_roll_number=student_in.univ_roll_number,
        mobile=student_in.mobile,
        department_id=student_in.department_id,
        year=student_in.year,
        semester=student_in.semester,
        section=student_in.section,
        batch=student_in.batch,
        program=student_in.program,
        class_name=student_in.class_name,
        admission_year=student_in.admission_year,
        cgpa=student_in.cgpa,
        guide_id=student_in.guide_id
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return {"detail": "Student created successfully", "id": db_student.id}

@router.put("/students/{student_id}")
def update_student_profile(student_id: int, student_update: schemas.StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = student_update.dict(exclude_unset=True)
    
    # Handle user level fields
    if "name" in update_data:
        student.user.name = update_data.pop("name")
    
    # Handle other fields
    for k, v in update_data.items():
        setattr(student, k, v)
        
    db.commit()
    return {"detail": "Student updated successfully"}

@router.delete("/students/{student_id}")
def delete_student(student_id: int, mode: str = "soft", db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if mode == "soft":
        student.is_deleted = True
        db.commit()
        return {"detail": "Student soft deleted successfully"}
        
    elif mode == "restore":
        student.is_deleted = False
        db.commit()
        return {"detail": "Student profile restored successfully"}
        
    elif mode == "permanent":
        user = student.user
        db.delete(student)
        db.delete(user)
        db.commit()
        return {"detail": "Student profile deleted permanently"}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid delete mode")

@router.post("/students/bulk-upload")
async def bulk_upload_students(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    records = []
    
    # Parse based on extension
    if file.filename.endswith(".csv"):
        stream = io.StringIO(content.decode("utf-8"))
        reader = csv.DictReader(stream)
        records = list(reader)
    elif file.filename.endswith(".xlsx"):
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = wb.active
        headers = [cell.value for cell in sheet[1]]
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if any(row):
                records.append(dict(zip(headers, row)))
    else:
        raise HTTPException(status_code=400, detail="Invalid file type. Upload CSV or XLSX.")

    imported = 0
    duplicates = 0
    invalid = 0

    for r in records:
        try:
            # Map parameters
            name = r.get("Name") or r.get("Student Name") or r.get("name")
            roll = r.get("Roll Number") or r.get("roll_number") or r.get("Roll")
            reg = r.get("Registration Number") or r.get("reg_number") or r.get("Reg")
            univ_roll = r.get("University Roll") or r.get("univ_roll_number") or r.get("Univ Roll")
            email = r.get("Email") or r.get("email")
            mobile = r.get("Mobile") or r.get("mobile") or r.get("Phone")
            dept_code = r.get("Department") or r.get("department") or r.get("Branch")
            year = int(r.get("Year") or r.get("year") or 1)
            semester = int(r.get("Semester") or r.get("semester") or 1)
            section = r.get("Section") or r.get("section") or "A"
            class_name = r.get("Class") or r.get("class") or ""
            batch = r.get("Batch") or r.get("batch") or "2023-2027"
            program = r.get("Program") or r.get("program") or "B.Tech"
            admission_year = int(r.get("Admission Year") or r.get("admission_year") or 2023)

            if not name or not roll or not email:
                invalid += 1
                continue

            # Check dept
            dept = db.query(models.Department).filter(models.Department.code == dept_code).first()
            if not dept:
                # auto create dept
                dept = models.Department(name=dept_code, code=dept_code)
                db.add(dept)
                db.commit()
                db.refresh(dept)

            # Check duplicates
            existing_user = db.query(models.User).filter(models.User.email == email).first()
            existing_student = db.query(models.Student).filter(models.Student.roll_number == roll).first()
            if existing_user or existing_student:
                duplicates += 1
                continue

            # Create User
            hashed_pwd = get_password_hash("password123")
            db_user = models.User(name=name, email=email, hashed_password=hashed_pwd, role="student")
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            # Create Student
            db_stud = models.Student(
                user_id=db_user.id,
                roll_number=str(roll),
                reg_number=str(reg or roll),
                univ_roll_number=str(univ_roll or roll),
                mobile=str(mobile or ""),
                department_id=dept.id,
                year=year,
                semester=semester,
                section=str(section),
                class_name=str(class_name),
                batch=str(batch),
                program=str(program),
                admission_year=admission_year,
                cgpa=8.0
            )
            db.add(db_stud)
            db.commit()
            imported += 1

        except Exception as e:
            invalid += 1
            continue

    return {
        "imported": imported,
        "duplicates": duplicates,
        "invalid": invalid
    }

@router.get("/students/hierarchy")
def get_students_hierarchy(db: Session = Depends(get_db)):
    """Builds nested hierarchy structure: Program -> Academic Year -> Department -> Section -> Class -> Student List"""
    students = db.query(models.Student).filter(models.Student.is_deleted == False).all()
    tree = {}
    
    for s in students:
        prog = s.program or "B.Tech"
        year = f"Year {s.year}"
        dept = s.department.code if s.department else "Unassigned"
        sec = f"Section {s.section}"
        cls = s.class_name or "Class General"
        
        # Build hierarchy dictionary
        if prog not in tree:
            tree[prog] = {}
        if year not in tree[prog]:
            tree[prog][year] = {}
        if dept not in tree[prog][year]:
            tree[prog][year][dept] = {}
        if sec not in tree[prog][year][dept]:
            tree[prog][year][dept][sec] = {}
        if cls not in tree[prog][year][dept][sec]:
            tree[prog][year][dept][sec][cls] = []
            
        tree[prog][year][dept][sec][cls].append({
            "id": s.id,
            "name": s.user.name,
            "roll_number": s.roll_number,
            "guide": s.guide.user.name if s.guide else "Unassigned",
            "project": db.query(models.Project).filter(models.Project.student_id == s.id).first().title if db.query(models.Project).filter(models.Project.student_id == s.id).first() else "No Project"
        })
        
    return tree

@router.get("/teachers")
def get_teachers_directory(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Teacher)
    if search:
        query = query.join(models.User).filter(
            (models.User.name.ilike(f"%{search}%")) |
            (models.Teacher.employee_id.ilike(f"%{search}%"))
        )
    teachers = query.all()
    res = []
    for t in teachers:
        assigned = db.query(models.Student).filter(models.Student.guide_id == t.id, models.Student.is_deleted == False).count()
        wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == t.id).first()
        capacity = wl.max_capacity if wl else 20
        
        specs = [s.specialization for s in t.specializations]
        
        res.append({
            "id": t.id,
            "name": t.user.name,
            "email": t.user.email,
            "employee_id": t.employee_id,
            "department_id": t.department_id,
            "department_name": t.department.name if t.department else "Unassigned",
            "designation": t.designation,
            "qualification": t.qualification,
            "experience": t.experience,
            "phone": t.phone,
            "office_location": t.office_location,
            "office_hours": t.office_hours,
            "specializations": specs,
            "assigned_students": assigned,
            "max_capacity": capacity,
            "remaining_capacity": max(0, capacity - assigned)
        })
    return res

@router.post("/teachers")
def create_teacher_manual(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    employee_id: str = Form(...),
    department_id: int = Form(...),
    designation: str = Form(...),
    qualification: str = Form(...),
    experience: int = Form(...),
    phone: str = Form(...),
    office_location: str = Form(...),
    office_hours: str = Form(...),
    specializations_json: str = Form(...), # JSON string array
    db: Session = Depends(get_db)
):
    # Check email and employee id
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_emp = db.query(models.Teacher).filter(models.Teacher.employee_id == employee_id).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    # Create User
    db_user = models.User(
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        role="teacher",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create Teacher
    db_teacher = models.Teacher(
        user_id=db_user.id,
        employee_id=employee_id,
        department_id=department_id,
        designation=designation,
        qualification=qualification,
        experience=experience,
        phone=phone,
        office_location=office_location,
        office_hours=office_hours
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)

    # Add Specializations
    specs = json.loads(specializations_json)
    for sp in specs:
        db_sp = models.TeacherSpecialization(teacher_id=db_teacher.id, specialization=sp)
        db.add(db_sp)
    db.commit()
    
    # Initialize Workload capacity
    db_wl = models.GuideWorkload(teacher_id=db_teacher.id, max_capacity=20)
    db.add(db_wl)
    db.commit()

    return {"detail": "Teacher created successfully"}

@router.put("/teachers/{teacher_id}")
def update_teacher_profile(
    teacher_id: int,
    name: str = Form(...),
    email: str = Form(...),
    designation: str = Form(...),
    qualification: str = Form(...),
    experience: int = Form(...),
    phone: str = Form(...),
    office_location: str = Form(...),
    office_hours: str = Form(...),
    max_capacity: int = Form(20),
    specializations_json: str = Form(...), # JSON string array
    db: Session = Depends(get_db)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    teacher.user.name = name
    teacher.user.email = email
    teacher.designation = designation
    teacher.qualification = qualification
    teacher.experience = experience
    teacher.phone = phone
    teacher.office_location = office_location
    teacher.office_hours = office_hours
    
    # Update capacity
    wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == teacher_id).first()
    if wl:
        wl.max_capacity = max_capacity
    else:
        wl = models.GuideWorkload(teacher_id=teacher_id, max_capacity=max_capacity)
        db.add(wl)

    # Update specializations
    db.query(models.TeacherSpecialization).filter(models.TeacherSpecialization.teacher_id == teacher_id).delete()
    specs = json.loads(specializations_json)
    for sp in specs:
        db_sp = models.TeacherSpecialization(teacher_id=teacher_id, specialization=sp)
        db.add(db_sp)

    db.commit()
    return {"detail": "Teacher updated successfully"}

@router.get("/allocations/workload")
def get_guide_workloads(db: Session = Depends(get_db)):
    """Guide Workload list detailing allocations, capacities, completed projects, and pending evaluations"""
    teachers = db.query(models.Teacher).all()
    res = []
    for t in teachers:
        assigned = db.query(models.Student).filter(models.Student.guide_id == t.id, models.Student.is_deleted == False).count()
        wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == t.id).first()
        capacity = wl.max_capacity if wl else 20
        
        # Completed projects: projects where student guide is this teacher, and status is completed
        completed = db.query(models.Project).join(models.Student).filter(
            models.Student.guide_id == t.id,
            models.Student.is_deleted == False,
            models.Project.status == "completed"
        ).count()

        pending_reviews = db.query(models.Project).join(models.Student).filter(
            models.Student.guide_id == t.id,
            models.Student.is_deleted == False,
            models.Project.status == "pending_review"
        ).count()

        res.append({
            "id": t.id,
            "name": t.user.name,
            "department": t.department.name if t.department else "Unassigned",
            "specializations": [s.specialization for s in t.specializations],
            "max_capacity": capacity,
            "assigned_students": assigned,
            "remaining_capacity": max(0, capacity - assigned),
            "completed_projects": completed,
            "pending_reviews": pending_reviews,
            "is_overloaded": assigned > capacity
        })
    return res

@router.post("/allocations/manual")
def manual_allocate_guide(student_id: int, teacher_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    
    if not student or not teacher:
        raise HTTPException(status_code=404, detail="Student or Teacher not found")
        
    # Check guide capacity
    assigned = db.query(models.Student).filter(models.Student.guide_id == teacher_id, models.Student.is_deleted == False).count()
    wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == teacher_id).first()
    capacity = wl.max_capacity if wl else 20
    
    is_exceeded = (assigned >= capacity)
    
    # Record allocation audit
    student.guide_id = teacher_id
    db_audit = models.GuideAllocation(student_id=student_id, teacher_id=teacher_id)
    db.add(db_audit)
    
    # Push notification mock to user
    notify_teacher = models.Notification(
        user_id=teacher.user_id,
        title="Student Allocated",
        message=f"Student {student.user.name} ({student.roll_number}) has been allocated to you."
    )
    notify_student = models.Notification(
        user_id=student.user_id,
        title="Guide Allocated",
        message=f"Academic Guide {teacher.user.name} has been assigned to supervise your project."
    )
    db.add(notify_teacher)
    db.add(notify_student)
    
    if is_exceeded:
        # Notify admin of overload
        admin_users = db.query(models.User).filter(models.User.role == "admin").all()
        for admin in admin_users:
            notify_admin = models.Notification(
                user_id=admin.id,
                title="Guide Overloaded Warning",
                message=f"Guide {teacher.user.name} has exceeded their maximum allocation capacity limit of {capacity} students."
            )
            db.add(notify_admin)
            
    db.commit()
    
    return {
        "detail": "Guide allocated successfully",
        "capacity_exceeded_warning": is_exceeded
    }

@router.post("/allocations/bulk")
def bulk_allocate_guides(
    department_id: int,
    year: int,
    section: str,
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Allocates a selected guide to all students matching a department, year, and section"""
    students = db.query(models.Student).filter(
        models.Student.department_id == department_id,
        models.Student.year == year,
        models.Student.section == section,
        models.Student.is_deleted == False
    ).all()

    if not students:
        raise HTTPException(status_code=404, detail="No students found matching filters")

    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Guide not found")

    allocated_count = 0
    for s in students:
        s.guide_id = teacher_id
        db_audit = models.GuideAllocation(student_id=s.id, teacher_id=teacher_id)
        db.add(db_audit)
        allocated_count += 1

    db.commit()
    return {"detail": f"Allocated guide to {allocated_count} students successfully"}

@router.get("/allocations/recommend")
def recommend_smart_guide(project_id: int, db: Session = Depends(get_db)):
    """Recommends guides for a project based on Specialization overlap, domain terms, and current guide workload"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Combine project elements for NLP keyword overlap analysis
    payload = f"{project.title} {project.domain or ''} {project.technologies or ''} {project.abstract or ''}".lower()
    
    teachers = db.query(models.Teacher).all()
    recommendations = []
    
    for t in teachers:
        assigned = db.query(models.Student).filter(models.Student.guide_id == t.id, models.Student.is_deleted == False).count()
        wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == t.id).first()
        capacity = wl.max_capacity if wl else 20
        remaining = max(0, capacity - assigned)
        
        # Calculate overlap score
        score = 0
        matching_keywords = []
        for s in t.specializations:
            spec_term = s.specialization.lower()
            if spec_term in payload:
                score += 5
                matching_keywords.append(s.specialization)
                
        # Domain mapping heuristics
        proj_domain = (project.domain or "").lower()
        for s in t.specializations:
            spec_term = s.specialization.lower()
            if spec_term in proj_domain:
                score += 10
                if s.specialization not in matching_keywords:
                    matching_keywords.append(s.specialization)

        # Factor workload: prefer teachers with remaining capacity
        score += (remaining * 0.5)

        recommendations.append({
            "teacher_id": t.id,
            "teacher_name": t.user.name,
            "specializations": [s.specialization for s in t.specializations],
            "score": score,
            "matching_keywords": matching_keywords,
            "remaining_capacity": remaining,
            "reason": f"Matches expertise in {', '.join(matching_keywords) if matching_keywords else 'General Computing'}. Workload remaining: {remaining} students."
        })

    # Sort by descending score
    recommendations = sorted(recommendations, key=lambda x: x["score"], reverse=True)
    return recommendations[:3] # Return top 3 recommendations

@router.get("/org/details")
def get_organization_parameters(db: Session = Depends(get_db)):
    """Retrieve lists of depts, classes, sections, programs, semesters, and batches for academic config"""
    depts = db.query(models.Department).all()
    years = db.query(models.AcademicYear).all()
    sections = db.query(models.Section).all()
    classes = db.query(models.Class).all()
    programs = db.query(models.Program).all()
    semesters = db.query(models.Semester).all()
    batches = db.query(models.Batch).all()
    
    return {
        "departments": [{"id": d.id, "name": d.name, "code": d.code} for d in depts],
        "years": [{"id": y.id, "name": y.name} for y in years],
        "sections": [{"id": s.id, "name": s.name} for s in sections],
        "programs": [{"id": p.id, "name": p.name} for p in programs],
        "semesters": [{"id": s.id, "number": s.number} for s in semesters],
        "batches": [{"id": b.id, "name": b.name} for b in batches],
        "classes": [{
            "id": c.id, 
            "name": c.name,
            "department_id": c.department_id,
            "academic_year_id": c.academic_year_id,
            "section_id": c.section_id,
            "class_teacher_id": c.class_teacher_id,
            "capacity": c.capacity
        } for c in classes]
    }

@router.post("/org/departments")
def add_org_department(name: str, code: str, db: Session = Depends(get_db)):
    existing = db.query(models.Department).filter(models.Department.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    db_dept = models.Department(name=name, code=code)
    db.add(db_dept)
    db.commit()
    return {"detail": "Department created"}

@router.post("/org/classes")
def add_org_class(
    name: str, 
    department_id: int, 
    academic_year_id: int, 
    section_id: int, 
    class_teacher_id: Optional[int] = None,
    capacity: int = 60,
    db: Session = Depends(get_db)
):
    db_cls = models.Class(
        name=name,
        department_id=department_id,
        academic_year_id=academic_year_id,
        section_id=section_id,
        class_teacher_id=class_teacher_id,
        capacity=capacity
    )
    db.add(db_cls)
    db.commit()
    return {"detail": "Class created successfully"}

@router.post("/org/sections")
def add_org_section(name: str, db: Session = Depends(get_db)):
    existing = db.query(models.Section).filter(models.Section.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Section already exists")
    db_sec = models.Section(name=name)
    db.add(db_sec)
    db.commit()
    return {"detail": "Section created"}

@router.post("/org/batches")
def add_org_batch(name: str, db: Session = Depends(get_db)):
    existing = db.query(models.Batch).filter(models.Batch.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch already exists")
    db_batch = models.Batch(name=name)
    db.add(db_batch)
    db.commit()
    return {"detail": "Batch created"}

@router.get("/reports/download")
def download_reports(report_type: str, db: Session = Depends(get_db)):
    """Exports structured reports (CSV stream responses) for lists and workloads"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "student_list":
        writer.writerow(["Student Name", "Roll Number", "Email", "Department", "Year", "Section", "Guide", "Project"])
        students = db.query(models.Student).filter(models.Student.is_deleted == False).all()
        for s in students:
            proj = db.query(models.Project).filter(models.Project.student_id == s.id).first()
            writer.writerow([
                s.user.name, 
                s.roll_number, 
                s.user.email, 
                s.department.code if s.department else "", 
                s.year, 
                s.section,
                s.guide.user.name if s.guide else "Unassigned",
                proj.title if proj else "N/A"
            ])
            
    elif report_type == "teacher_list":
        writer.writerow(["Faculty Name", "Employee ID", "Designation", "Department", "Email", "Specializations", "Assigned Students"])
        teachers = db.query(models.Teacher).all()
        for t in teachers:
            assigned = db.query(models.Student).filter(models.Student.guide_id == t.id, models.Student.is_deleted == False).count()
            specs = ", ".join([s.specialization for s in t.specializations])
            writer.writerow([t.user.name, t.employee_id, t.designation, t.department.name if t.department else "", t.user.email, specs, assigned])
            
    elif report_type == "guide_workload":
        writer.writerow(["Guide Name", "Department", "Capacity", "Assigned Students", "Remaining Capacity", "Completed Projects", "Pending Reviews"])
        teachers = db.query(models.Teacher).all()
        for t in teachers:
            assigned = db.query(models.Student).filter(models.Student.guide_id == t.id, models.Student.is_deleted == False).count()
            wl = db.query(models.GuideWorkload).filter(models.GuideWorkload.teacher_id == t.id).first()
            capacity = wl.max_capacity if wl else 20
            completed = db.query(models.Project).join(models.Student).filter(
                models.Student.guide_id == t.id,
                models.Student.is_deleted == False,
                models.Project.status == "completed"
            ).count()
            pending = db.query(models.Project).join(models.Student).filter(
                models.Student.guide_id == t.id,
                models.Student.is_deleted == False,
                models.Project.status == "pending_review"
            ).count()
            writer.writerow([t.user.name, t.department.name if t.department else "", capacity, assigned, max(0, capacity - assigned), completed, pending])
            
    else:
        writer.writerow(["Error", "Invalid report type"])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"}
    )
