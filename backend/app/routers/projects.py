from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import json
from ..core.db import get_db
from ..core.security import get_current_user_payload, RoleChecker
from ..models import models
from ..schemas import schemas

router = APIRouter(prefix="/api/projects", tags=["projects"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper: Get current student
def get_current_student(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)) -> models.Student:
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can perform this action")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return user.student_profile

@router.post("", response_model=schemas.ProjectOut)
def create_project(project_in: schemas.ProjectCreate, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    project = models.Project(
        title=project_in.title,
        abstract=project_in.abstract,
        description=project_in.description,
        domain=project_in.domain,
        category=project_in.category,
        technologies=project_in.technologies,
        difficulty_level=project_in.difficulty_level,
        team_size=project_in.team_size,
        github_repo=project_in.github_repo,
        live_url=project_in.live_url,
        figma_url=project_in.figma_url,
        doc_url=project_in.doc_url,
        start_date=project_in.start_date,
        end_date=project_in.end_date,
        student_id=student.id,
        status="pending_review"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[schemas.ProjectOut])
def get_projects(
    domain: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Project)
    if domain:
        query = query.filter(models.Project.domain == domain)
    if category:
        query = query.filter(models.Project.category == category)
    if status:
        query = query.filter(models.Project.status == status)
    if difficulty:
        query = query.filter(models.Project.difficulty_level == difficulty)
    return query.all()

@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, project_in: schemas.ProjectUpdate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check permissions (student owns it, or guide evaluates it, or HOD/Admin)
    role = payload.get("role")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if role == "student":
        if project.student_id != user.student_profile.id:
            raise HTTPException(status_code=403, detail="You do not own this project")
    elif role == "teacher":
        if project.student.guide_id != user.teacher_profile.id:
            raise HTTPException(status_code=403, detail="You are not the guide of this student")
            
    # Update fields
    for field, val in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, val)
        
    db.commit()
    db.refresh(project)
    return project

@router.post("/{project_id}/progress", response_model=schemas.ProgressUpdateOut)
def add_progress_update(project_id: int, update_in: schemas.ProgressUpdateCreate, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.student_id == student.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not owned by current student")
        
    # Check if this week's progress exists to perform update or insert
    update = db.query(models.ProgressUpdate).filter(
        models.ProgressUpdate.project_id == project_id,
        models.ProgressUpdate.week_number == update_in.week_number
    ).first()
    
    if update:
        update.work_done = update_in.work_done
        update.progress_percentage = update_in.progress_percentage
    else:
        update = models.ProgressUpdate(
            project_id=project_id,
            week_number=update_in.week_number,
            work_done=update_in.work_done,
            progress_percentage=update_in.progress_percentage
        )
        db.add(update)
        
    db.commit()
    db.refresh(update)
    return update

@router.post("/{project_id}/upload/{file_type}", response_model=schemas.ProjectFileOut)
def upload_project_file(project_id: int, file_type: str, file: UploadFile = File(...), student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.student_id == student.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not owned by current student")
    if file_type not in ["report_pdf", "ppt", "zip_code", "image", "video", "synopsis"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    # File validation
    filename = f"proj_{project_id}_{file_type}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_file = models.ProjectFile(
        project_id=project_id,
        file_type=file_type,
        file_name=file.filename,
        file_path=filepath
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

# ========================================================
# PORTFOLIO DATA CRUDS
# ========================================================

@router.get("/portfolio/{student_id_or_roll}")
def get_portfolio(student_id_or_roll: str, db: Session = Depends(get_db)):
    """Retrieves full portfolio datasets by student ID or Roll number"""
    student = db.query(models.Student).filter(
        (models.Student.id == student_id_or_roll) | 
        (models.Student.roll_number == student_id_or_roll)
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return {
        "student": {
            "name": student.user.name,
            "email": student.user.email,
            "roll_number": student.roll_number,
            "reg_number": student.reg_number,
            "univ_roll_number": student.univ_roll_number,
            "mobile": student.mobile,
            "department": student.department.name if student.department else "",
            "year": student.year,
            "semester": student.semester,
            "section": student.section,
            "batch": student.batch,
            "skills": json.loads(student.skills) if student.skills else [],
            "linkedin": student.linkedin,
            "github": student.github,
            "resume_url": student.resume_url,
            "profile_pic_url": student.profile_pic_url
        },
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "abstract": p.abstract,
                "description": p.description,
                "domain": p.domain,
                "category": p.category,
                "technologies": p.technologies.split(",") if p.technologies else [],
                "difficulty_level": p.difficulty_level,
                "github_repo": p.github_repo,
                "live_url": p.live_url,
                "figma_url": p.figma_url,
                "doc_url": p.doc_url,
                "status": p.status,
                "marks": p.marks
            } for p in student.projects
        ],
        "certificates": [schemas.CertificateOut.model_validate(c) for c in student.certificates],
        "achievements": [schemas.AchievementOut.model_validate(a) for a in student.achievements],
        "research_papers": [schemas.ResearchPaperOut.model_validate(r) for r in student.research_papers],
        "internships": [schemas.InternshipOut.model_validate(i) for i in student.internships],
        "patents": [schemas.PatentOut.model_validate(p) for p in student.patents],
        "hackathons": [schemas.HackathonOut.model_validate(h) for h in student.hackathons]
    }

@router.post("/portfolio/certificates", response_model=schemas.CertificateOut)
def add_certificate(cert: schemas.CertificateBase, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_cert = models.Certificate(**cert.model_dump(), student_id=student.id)
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert

@router.post("/portfolio/achievements", response_model=schemas.AchievementOut)
def add_achievement(ach: schemas.AchievementBase, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_ach = models.Achievement(**ach.model_dump(), student_id=student.id)
    db.add(db_ach)
    db.commit()
    db.refresh(db_ach)
    return db_ach

@router.post("/portfolio/research", response_model=schemas.ResearchPaperOut)
def add_research_paper(paper: schemas.ResearchPaperBase, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_paper = models.ResearchPaper(**paper.model_dump(), student_id=student.id)
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper

@router.post("/portfolio/internships", response_model=schemas.InternshipOut)
def add_internship(intern: schemas.InternshipBase, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_intern = models.Internship(**intern.model_dump(), student_id=student.id)
    db.add(db_intern)
    db.commit()
    db.refresh(db_intern)
    return db_intern

@router.post("/portfolio/patents", response_model=schemas.PatentOut)
def add_patent(pat: schemas.PatentBase, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_pat = models.Patent(**pat.model_dump(), student_id=student.id)
    db.add(db_pat)
    db.commit()
    db.refresh(db_pat)
    return db_pat

@router.post("/portfolio/hackathons", response_model=schemas.HackathonOut)
def add_hackathon(hack: schemas.HackathonBase, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_hack = models.Hackathon(**hack.model_dump(), student_id=student.id)
    db.add(db_hack)
    db.commit()
    db.refresh(db_hack)
    return db_hack

# ========================================================
# MILESTONES ENDPOINTS
# ========================================================

@router.get("/{project_id}/milestones", response_model=List[schemas.MilestoneOut])
def get_project_milestones(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Milestone).filter(models.Milestone.project_id == project_id).all()

@router.post("/{project_id}/milestones", response_model=schemas.MilestoneOut)
def create_project_milestone(project_id: int, milestone_in: schemas.MilestoneCreate, db: Session = Depends(get_db)):
    db_milestone = models.Milestone(**milestone_in.model_dump(), project_id=project_id)
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

@router.put("/milestones/{milestone_id}", response_model=schemas.MilestoneOut)
def update_project_milestone(milestone_id: int, milestone_in: schemas.MilestoneBase, db: Session = Depends(get_db)):
    db_milestone = db.query(models.Milestone).filter(models.Milestone.id == milestone_id).first()
    if not db_milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    for field, val in milestone_in.model_dump(exclude_unset=True).items():
        setattr(db_milestone, field, val)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone

@router.delete("/milestones/{milestone_id}")
def delete_project_milestone(milestone_id: int, db: Session = Depends(get_db)):
    db_milestone = db.query(models.Milestone).filter(models.Milestone.id == milestone_id).first()
    if not db_milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(db_milestone)
    db.commit()
    return {"detail": "Milestone deleted successfully"}

# ========================================================
# GITHUB INTEGRATION ENDPOINTS
# ========================================================

@router.get("/{project_id}/github", response_model=schemas.GithubIntegrationOut)
def get_project_github(project_id: int, db: Session = Depends(get_db)):
    git = db.query(models.GithubIntegration).filter(models.GithubIntegration.project_id == project_id).first()
    if not git:
        git = models.GithubIntegration(
            project_id=project_id,
            repo_name="example/my-project",
            branch="main",
            commit_count=12,
            stars=3,
            issues=1,
            latest_commit="Initial commit"
        )
        db.add(git)
        db.commit()
        db.refresh(git)
    return git

@router.post("/{project_id}/github", response_model=schemas.GithubIntegrationOut)
def sync_project_github(project_id: int, git_in: schemas.GithubIntegrationCreate, db: Session = Depends(get_db)):
    git = db.query(models.GithubIntegration).filter(models.GithubIntegration.project_id == project_id).first()
    if git:
        for field, val in git_in.model_dump(exclude_unset=True).items():
            setattr(git, field, val)
    else:
        git = models.GithubIntegration(**git_in.model_dump(), project_id=project_id)
        db.add(git)
    db.commit()
    db.refresh(git)
    return git

# ========================================================
# PLACEMENT RECORDS ENDPOINTS
# ========================================================

@router.get("/placement/records", response_model=List[schemas.PlacementRecordOut])
def get_placement_records(student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return db.query(models.PlacementRecord).filter(models.PlacementRecord.student_id == student.id).all()

@router.post("/placement/records", response_model=schemas.PlacementRecordOut)
def add_placement_record(record_in: schemas.PlacementRecordCreate, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_rec = models.PlacementRecord(**record_in.model_dump(), student_id=student.id)
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec

@router.delete("/placement/records/{record_id}")
def delete_placement_record(record_id: int, student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    db_rec = db.query(models.PlacementRecord).filter(
        models.PlacementRecord.id == record_id,
        models.PlacementRecord.student_id == student.id
    ).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Placement record not found")
    db.delete(db_rec)
    db.commit()
    return {"detail": "Placement record deleted"}
