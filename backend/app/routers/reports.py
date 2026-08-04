from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
from ..core.db import get_db
from ..core.security import RoleChecker
from ..models import models
from ..services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["reports"], dependencies=[Depends(RoleChecker(["teacher", "hod", "admin"]))])

@router.get("/export")
def export_data(
    report_type: str = Query(..., regex="^(students|projects|progress)$"),
    export_format: str = Query(..., regex="^(csv|excel|pdf)$"),
    dept_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Compiles records from the database and constructs a downloadable CSV, Excel sheet, or PDF file"""
    data = []
    
    if report_type == "students":
        query = db.query(models.Student)
        if dept_id:
            query = query.filter(models.Student.department_id == dept_id)
        students = query.all()
        
        headers = ["Name", "Email", "Roll Number", "Year", "Semester", "Section", "Guide"]
        for s in students:
            data.append({
                "Name": s.user.name,
                "Email": s.user.email,
                "Roll Number": s.roll_number,
                "Year": f"{s.year} Year",
                "Semester": f"Sem {s.semester}",
                "Section": s.section,
                "Guide": s.guide.user.name if s.guide else "Unassigned"
            })
            
    elif report_type == "projects":
        query = db.query(models.Project)
        if dept_id:
            query = query.join(models.Student).filter(models.Student.department_id == dept_id)
        projects = query.all()
        
        headers = ["Project Title", "Student Name", "Domain", "Category", "Status", "Marks", "Technologies"]
        for p in projects:
            data.append({
                "Project Title": p.title,
                "Student Name": p.student.user.name,
                "Domain": p.domain or "N/A",
                "Category": p.category or "N/A",
                "Status": p.status,
                "Marks": p.marks,
                "Technologies": p.technologies or ""
            })
            
    elif report_type == "progress":
        query = db.query(models.ProgressUpdate).join(models.Project)
        if dept_id:
            query = query.join(models.Student, models.Project.student_id == models.Student.id).filter(models.Student.department_id == dept_id)
        progress = query.all()
        
        headers = ["Project Title", "Student Name", "Week", "Progress %", "Work Completed"]
        for pr in progress:
            data.append({
                "Project Title": pr.project.title,
                "Student Name": pr.project.student.user.name,
                "Week": f"Week {pr.week_number}",
                "Progress %": f"{pr.progress_percentage}%",
                "Work Completed": pr.work_done
            })

    if not data:
        raise HTTPException(status_code=404, detail="No data found matching criteria")

    # Generate response
    if export_format == "csv":
        bytes_data = ReportService.export_csv(data)
        media_type = "text/csv"
        filename = f"{report_type}_report.csv"
        
    elif export_format == "excel":
        bytes_data = ReportService.export_excel(data, report_type.capitalize())
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{report_type}_report.xlsx"
        
    elif export_format == "pdf":
        rows = [[item[header] for header in headers] for item in data]
        title = f"{report_type.capitalize()} Department Report"
        bytes_data = ReportService.export_pdf(title, headers, rows)
        media_type = "application/pdf"
        filename = f"{report_type}_report.pdf"

    return StreamingResponse(
        io.BytesIO(bytes_data),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
