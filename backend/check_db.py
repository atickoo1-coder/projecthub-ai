from app.core.db import SessionLocal
from app.models import models
from app.core.security import verify_password

db = SessionLocal()
users = db.query(models.User).all()
print(f"Total users found: {len(users)}")
for u in users:
    verified = verify_password("password123", u.hashed_password)
    print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | Verified: {verified} | Hash: {u.hashed_password}")
db.close()
