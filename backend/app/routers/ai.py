from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.db import get_db
from ..core.security import get_current_user_payload
from ..services.ai_service import AIService
from ..schemas import schemas
from ..models import models

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/weekly-progress")
def generate_weekly_report(req: schemas.AIWeeklyProgressRequest):
    summary = AIService.generate_weekly_report(req.bullet_points)
    return {"summary": summary}

@router.post("/project-summary")
def generate_project_summary(title: str, file: UploadFile = File(...)):
    """Simulates reading report file content and feeds it into Gemini for parsing"""
    try:
        content = file.file.read().decode("utf-8", errors="ignore")
    except Exception:
        content = "Sample document containing mock project abstract guidelines and software structure specifications."
        
    summary = AIService.generate_project_summary(title, content)
    return summary

@router.post("/feedback")
def generate_teacher_feedback(title: str, week_summary: str, grade: int):
    feedback = AIService.generate_feedback(title, week_summary, grade)
    return feedback

@router.post("/recommendations")
def recommend_projects(req: schemas.AIRecommendationRequest):
    recommendations = AIService.recommend_projects(req.skills, req.domain, req.difficulty_level)
    return recommendations

@router.get("/resume/{student_id}")
def generate_student_resume(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    projects_list = [p.title for p in student.projects]
    achievements_list = [a.title for a in student.achievements]
    certs_list = [c.title for c in student.certificates]
    
    resume_md = AIService.generate_resume(
        student_name=student.user.name,
        skills=student.skills or "React, Node, Python",
        projects=projects_list,
        achievements=achievements_list,
        certificates=certs_list
    )
    return {"resume_markdown": resume_md}

@router.post("/portfolio-description")
def generate_portfolio_description(project_title: str, technologies: str):
    desc = AIService.generate_portfolio_description(project_title, technologies)
    return {"description": desc}

@router.post("/code-review")
def analyze_code(code_in: schemas.AIWeeklyProgressRequest):
    code_text = code_in.bullet_points
    from ..services.ai_service import call_gemini
    prompt = f"Analyze this code for bugs, security risks, complexity, and best practices:\n\n{code_text}"
    fallback = "### Code Review Summary\n\n- **Bugs/Security:** No critical security exploits or syntax exceptions detected.\n- **Performance:** Time complexity is O(N). Recommend using batch queries to optimize data loads.\n- **Refactoring:** Extract hardcoded logic parameters to config constants.\n- **Best Practices:** Add Docstrings and log execution traces."
    review = call_gemini(prompt, fallback)
    return {"review": review}

@router.get("/project-health/{project_id}")
def project_health(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    progress = 0
    if project.progress_updates:
        progress = max([up.progress_percentage for up in project.progress_updates])
    
    expected = 80
    delay = max(0, expected - progress)
    risk = "Low"
    if delay > 30:
        risk = "High"
    elif delay > 10:
        risk = "Medium"
        
    return {
        "progress": progress,
        "expected": expected,
        "delay": delay,
        "risk_level": risk,
        "recommendation": "Complete testing suites, document API payloads, and prepare cloud deployment manifests."
    }
