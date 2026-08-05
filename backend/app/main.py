from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from .core.db import Base, engine, get_db
from .core.security import get_current_user_payload
from .models import models
from .schemas import schemas
from .routers import auth, projects, teachers, hod, admin, chat, meetings, ai, reports, teacher_ops

# Automatically create tables in MySQL/SQLite if they don't exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database tables creation bypassed/failed: {str(e)}")

app = FastAPI(
    title="ProjectHub AI API",
    description="Student Project Tracking & Portfolio Management ERP",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Vite frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Register Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(teachers.router)
app.include_router(hod.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(meetings.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(teacher_ops.router)

# Serve uploaded deliverables statically
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to ProjectHub AI - Academic Project Tracking API Server"}

# Notification endpoints
@app.get("/api/notifications", response_model=List[schemas.NotificationOut])
def get_user_notifications(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(models.Notification).filter(
        models.Notification.user_id == user.id
    ).order_by(models.Notification.created_at.desc()).all()

@app.put("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"detail": "Notification marked as read"}
