import json
from app.core.db import SessionLocal, Base, engine
from app.models import models
from app.core.security import get_password_hash

def seed_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if database is already seeded
    if db.query(models.User).first() is not None:
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database...")
    
    # Add Departments
    depts = [
        models.Department(id=1, name="Computer Science & Engineering", code="CSE"),
        models.Department(id=2, name="Artificial Intelligence & Machine Learning", code="AI"),
        models.Department(id=3, name="Data Science", code="DS"),
        models.Department(id=4, name="Information Technology", code="IT"),
        models.Department(id=5, name="Electronics & Communication Engineering", code="ECE"),
        models.Department(id=6, name="Mechanical Engineering", code="ME")
    ]
    for d in depts:
        db.add(d)
    db.flush()
    
    # Add Users
    pwd_hash = get_password_hash("password123")
    users = [
        models.User(id=1, name="System Administrator", email="admin@college.edu", hashed_password=pwd_hash, role="admin"),
        models.User(id=2, name="Dr. Sarah Connor", email="sarah.connor@college.edu", hashed_password=pwd_hash, role="hod"),
        models.User(id=3, name="Prof. Alan Turing", email="alan.turing@college.edu", hashed_password=pwd_hash, role="teacher"),
        models.User(id=4, name="Dr. Grace Hopper", email="grace.hopper@college.edu", hashed_password=pwd_hash, role="teacher"),
        models.User(id=5, name="Alice Smith", email="alice.smith@college.edu", hashed_password=pwd_hash, role="student"),
        models.User(id=6, name="Bob Jones", email="bob.jones@college.edu", hashed_password=pwd_hash, role="student")
    ]
    for u in users:
        db.add(u)
    db.flush()
    
    # Add Teachers
    teachers = [
        models.Teacher(id=1, user_id=2, department_id=1, designation="Professor & HOD"),
        models.Teacher(id=2, user_id=3, department_id=2, designation="Assistant Professor"),
        models.Teacher(id=3, user_id=4, department_id=1, designation="Associate Professor")
    ]
    for t in teachers:
        db.add(t)
    db.flush()
    
    # Add Students
    students = [
        models.Student(
            id=1,
            user_id=5,
            roll_number="CSE-2023-045",
            reg_number="REG987654321",
            univ_roll_number="UNIV-CSE-001",
            mobile="9876543210",
            department_id=1,
            year=4,
            semester=7,
            section="A",
            guide_id=3,
            batch="2023-2027",
            skills=json.dumps(["React", "Node.js", "Python", "MySQL", "JavaScript", "MongoDB"]),
            gender="Female",
            date_of_birth="2002-04-12",
            address="123 Academic Lane, Campus Town",
            college="University College of Engineering",
            program="B.Tech",
            class_name="Fourth Year CSE - Sec A",
            admission_year=2023,
            cgpa=8.45
        ),
        models.Student(
            id=2,
            user_id=6,
            roll_number="AI-2023-012",
            reg_number="REG987654322",
            univ_roll_number="UNIV-AI-002",
            mobile="9876543211",
            department_id=2,
            year=3,
            semester=5,
            section="B",
            guide_id=2,
            batch="2024-2028",
            skills=json.dumps(["Python", "TensorFlow", "FastAPI", "PyTorch", "MySQL"]),
            gender="Male",
            date_of_birth="2003-09-25",
            address="456 Research Blvd, Innovate City",
            college="University College of Engineering",
            program="B.Tech",
            class_name="Third Year AI - Sec B",
            admission_year=2024,
            cgpa=7.89
        )
    ]
    for s in students:
        db.add(s)
    db.flush()
    
    # Add Projects
    projects = [
        models.Project(
            id=1,
            title="AI-Based Smart Attendance System",
            abstract="A facial recognition-based attendance tracking application.",
            description="Using OpenCV and convolutional neural networks to perform face matching on video feeds and log student attendance in a database.",
            domain="Computer Vision",
            category="Web Application",
            technologies="Python,OpenCV,React,FastAPI,MySQL",
            difficulty_level="intermediate",
            team_size=2,
            github_repo="https://github.com/example/attendance",
            live_url="https://attendance.example.com",
            status="approved",
            student_id=2
        ),
        models.Project(
            id=2,
            title="Decentralized Peer-to-Peer File Storage",
            abstract="A block-chain secured file locker system.",
            description="A storage network that splits user files into encrypted fragments and distributes them across nodes using IPFS and Ethereum smart contracts.",
            domain="Blockchain",
            category="System Programming",
            technologies="Solidity,React,IPFS,Node.js",
            difficulty_level="advanced",
            team_size=1,
            github_repo="https://github.com/example/d-storage",
            status="pending_review",
            student_id=1
        )
    ]
    for p in projects:
        db.add(p)
    db.flush()
    
    # Add progress updates
    updates = [
        models.ProgressUpdate(project_id=1, week_number=1, work_done="Created database schema, project design, and basic UI wireframes.", progress_percentage=20),
        models.ProgressUpdate(project_id=1, week_number=2, work_done="Implemented facial verification pipeline using OpenCV and MTCNN.", progress_percentage=40)
    ]
    for up in updates:
        db.add(up)
        
    # Add feedbacks
    feedbacks = [
        models.Feedback(
            project_id=1,
            teacher_id=2,
            rating=8,
            comments="Excellent face recognition pipeline. Recommend optimizing detection speed.",
            positive_points="High accuracy, clean code structure.",
            areas_of_improvement="Model inference speed under multiple faces.",
            recommendations="Optimize image resizing or batching before forwarding to the neural network."
        )
    ]
    for f in feedbacks:
        db.add(f)
        
    # Add Milestones
    milestones = [
        models.Milestone(
            project_id=1,
            title="Proposal Approval",
            description="Submit abstract and team structure",
            deadline="2026-08-15",
            status="completed",
            marks=18,
            max_marks=20,
            feedback="Excellent abstract."
        ),
        models.Milestone(
            project_id=1,
            title="Requirement Analysis",
            description="System requirement specifications (SRS) and architecture design",
            deadline="2026-08-30",
            status="completed",
            marks=19,
            max_marks=20,
            feedback="Very comprehensive documentation."
        ),
        models.Milestone(
            project_id=1,
            title="Design & Prototypes",
            description="Figma prototypes, layout designs and db ERD schema",
            deadline="2026-09-15",
            status="completed",
            marks=17,
            max_marks=20,
            feedback="UX design looks highly premium."
        ),
        models.Milestone(
            project_id=1,
            title="Core Implementation",
            description="Implement key algorithms and UI frontend integration",
            deadline="2026-09-30",
            status="in_progress"
        ),
        models.Milestone(
            project_id=1,
            title="Deployment & Review",
            description="Formulate final cloud deployments and present demo video",
            deadline="2026-10-15",
            status="pending"
        )
    ]
    for m in milestones:
        db.add(m)
        
    # Add Github Integration cache
    git = models.GithubIntegration(
        project_id=1,
        repo_name="anshultickoo/smart-attendance-ai",
        branch="main",
        commit_count=65,
        stars=15,
        issues=3,
        latest_commit="Refactored face verification MTCNN model speed"
    )
    db.add(git)
    
    # Add Placement Records
    placements = [
        models.PlacementRecord(
            student_id=1,
            company_name="Google",
            role="Associate Product Manager / SWE Intern",
            status="interviewing",
            salary_package="35 LPA"
        ),
        models.PlacementRecord(
            student_id=1,
            company_name="Microsoft",
            role="Software Engineer Intern",
            status="offered",
            salary_package="22 LPA"
        )
    ]
    for pl in placements:
        db.add(pl)
        
    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
