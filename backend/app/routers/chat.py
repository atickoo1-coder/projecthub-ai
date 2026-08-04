from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from ..core.db import get_db
from ..core.security import get_current_user_payload
from ..models import models
from ..schemas import schemas

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.get("/users", response_model=List[schemas.UserOut])
def get_chat_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """Retrieve other users to start a chat with"""
    if payload.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to access chat discussions.")
    email = payload.get("sub")
    current_user = db.query(models.User).filter(models.User.email == email).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    query = db.query(models.User).filter(models.User.id != current_user.id)
    if search:
        query = query.filter(models.User.name.ilike(f"%{search}%") | models.User.email.ilike(f"%{search}%"))
    if role:
        query = query.filter(models.User.role == role)
        
    return query.limit(20).all()

@router.get("/threads")
def get_chat_threads(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    """Retrieve all users current user has messages with"""
    if payload.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to access chat discussions.")
    email = payload.get("sub")
    current_user = db.query(models.User).filter(models.User.email == email).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Query distinct senders/receivers
    msgs = db.query(models.ChatMessage).filter(
        or_(models.ChatMessage.sender_id == current_user.id, models.ChatMessage.receiver_id == current_user.id)
    ).order_by(models.ChatMessage.sent_at.desc()).all()
    
    contacts = {}
    for m in msgs:
        contact_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if contact_id not in contacts:
            contact_user = db.query(models.User).filter(models.User.id == contact_id).first()
            if contact_user:
                contacts[contact_id] = {
                    "id": contact_user.id,
                    "name": contact_user.name,
                    "role": contact_user.role,
                    "last_message": m.message,
                    "sent_at": m.sent_at,
                    "unread": not m.is_read and m.receiver_id == current_user.id
                }
                
    return list(contacts.values())

@router.get("/history/{other_user_id}", response_model=List[schemas.ChatMessageOut])
def get_chat_history(other_user_id: int, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    """Retrieve conversation history with a specific contact"""
    if payload.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to view chat history.")
    email = payload.get("sub")
    current_user = db.query(models.User).filter(models.User.email == email).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Mark messages as read
    db.query(models.ChatMessage).filter(
        models.ChatMessage.sender_id == other_user_id,
        models.ChatMessage.receiver_id == current_user.id,
        models.ChatMessage.is_read == False
    ).update({models.ChatMessage.is_read: True})
    db.commit()
    
    history = db.query(models.ChatMessage).filter(
        or_(
            and_(models.ChatMessage.sender_id == current_user.id, models.ChatMessage.receiver_id == other_user_id),
            and_(models.ChatMessage.sender_id == other_user_id, models.ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(models.ChatMessage.sent_at.asc()).all()
    
    return history

@router.post("/send", response_model=schemas.ChatMessageOut)
def send_chat_message(msg_in: schemas.ChatMessageCreate, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if payload.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin is not permitted to send chat messages.")
    email = payload.get("sub")
    current_user = db.query(models.User).filter(models.User.email == email).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check receiver exists
    receiver = db.query(models.User).filter(models.User.id == msg_in.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
        
    db_msg = models.ChatMessage(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        message=msg_in.message
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg
