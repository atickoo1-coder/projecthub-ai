-- Create Database
CREATE DATABASE IF NOT EXISTS projecthub;
USE projecthub;

-- Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'hod', 'admin') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department_id INT NOT NULL,
    designation VARCHAR(100) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    reg_number VARCHAR(50) NOT NULL UNIQUE,
    univ_roll_number VARCHAR(50) NOT NULL UNIQUE,
    mobile VARCHAR(15),
    department_id INT NOT NULL,
    year INT NOT NULL, -- 1, 2, 3, 4
    semester INT NOT NULL, -- 1 to 8
    section VARCHAR(10) NOT NULL, -- A, B, C...
    guide_id INT, -- assigned teacher
    batch VARCHAR(20), -- e.g. 2023-2027
    skills TEXT, -- JSON array or comma separated
    linkedin VARCHAR(255),
    github VARCHAR(255),
    resume_url VARCHAR(255),
    profile_pic_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (guide_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,
    description TEXT,
    domain VARCHAR(100),
    category VARCHAR(100),
    technologies TEXT, -- comma separated
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
    team_size INT DEFAULT 1,
    github_repo VARCHAR(255),
    live_url VARCHAR(255),
    figma_url VARCHAR(255),
    doc_url VARCHAR(255),
    status ENUM('pending_review', 'approved', 'revision_requested', 'completed') DEFAULT 'pending_review',
    marks INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Project Files Table
CREATE TABLE IF NOT EXISTS project_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    file_type ENUM('report_pdf', 'ppt', 'zip_code', 'image', 'video') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Progress Updates Table
CREATE TABLE IF NOT EXISTS progress_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    week_number INT NOT NULL,
    work_done TEXT NOT NULL,
    progress_percentage INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_week (project_id, week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    teacher_id INT NOT NULL,
    rating INT, -- out of 10 or 5
    comments TEXT,
    positive_points TEXT,
    areas_of_improvement TEXT,
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    join_url VARCHAR(255),
    created_by INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Portfolio Modules Tables (Certificates, Achievements, Research Papers, Internships, Patents, Hackathons)
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    achievement_type VARCHAR(100), -- hackathon, coding, academic, sports, etc.
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS research_papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    journal VARCHAR(255) NOT NULL,
    publication_date DATE,
    paper_url VARCHAR(255),
    authors VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS internships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    patent_number VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50), -- filed, published, granted
    publication_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hackathons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    project_title VARCHAR(255),
    result VARCHAR(100), -- Winner, Runner-up, Participant
    date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience ENUM('all', 'students', 'teachers') DEFAULT 'all',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    notification_type VARCHAR(50), -- deadline, feedback, approval, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ========================================================
-- SEED DATA
-- ========================================================

-- Insert Departments
INSERT INTO departments (id, name, code) VALUES
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Artificial Intelligence & Machine Learning', 'AI'),
(3, 'Data Science', 'DS'),
(4, 'Information Technology', 'IT'),
(5, 'Electronics & Communication Engineering', 'ECE'),
(6, 'Mechanical Engineering', 'ME');

-- Insert Users (Password: password123, Bcrypt Hash: $2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS)
INSERT INTO users (id, name, email, hashed_password, role) VALUES
(1, 'System Administrator', 'admin@college.edu', '$2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS', 'admin'),
(2, 'Dr. Sarah Connor', 'sarah.connor@college.edu', '$2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS', 'hod'),
(3, 'Prof. Alan Turing', 'alan.turing@college.edu', '$2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS', 'teacher'),
(4, 'Dr. Grace Hopper', 'grace.hopper@college.edu', '$2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS', 'teacher'),
(5, 'Alice Smith', 'alice.smith@college.edu', '$2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS', 'student'),
(6, 'Bob Jones', 'bob.jones@college.edu', '$2b$12$Ksqq4kE82fIuW0jE4l6OyeW.bS9YfJt0d2c7qQ8.73p0W1zL0b.yS', 'student');

-- Insert Teachers (Sarah Connor is HOD of CSE, Alan Turing ECE, Grace Hopper CSE)
INSERT INTO teachers (id, user_id, department_id, designation) VALUES
(1, 2, 1, 'Professor & HOD'),
(2, 3, 2, 'Assistant Professor'),
(3, 4, 1, 'Associate Professor');

-- Insert Students
INSERT INTO students (id, user_id, roll_number, reg_number, univ_roll_number, mobile, department_id, year, semester, section, guide_id, batch, skills) VALUES
(1, 5, 'CSE-2023-045', 'REG987654321', 'UNIV-CSE-001', '9876543210', 1, 4, 7, 'A', 3, '2023-2027', '["React", "Node.js", "Python", "MySQL"]'),
(2, 6, 'AI-2023-012', 'REG987654322', 'UNIV-AI-002', '9876543211', 2, 3, 5, 'B', 2, '2024-2028', '["Python", "TensorFlow", "Scikit-Learn", "FastAPI"]');

-- Insert Projects
INSERT INTO projects (id, title, abstract, description, domain, category, technologies, difficulty_level, team_size, github_repo, live_url, status, student_id) VALUES
(1, 'AI-Based Smart Attendance System', 'A facial recognition-based attendance tracking application.', 'Using OpenCV and convolutional neural networks to perform face matching on video feeds and log student attendance in a MySQL database with a React-based monitoring portal.', 'Computer Vision', 'Web Application', 'Python,OpenCV,React,FastAPI,MySQL', 'intermediate', 2, 'https://github.com/example/attendance', 'https://attendance.example.com', 'approved', 2),
(2, 'Decentralized Peer-to-Peer File Storage', 'A block-chain secured file locker system.', 'A storage network that splits user files into encrypted fragments and distributes them across nodes using IPFS and Ethereum smart contracts.', 'Blockchain', 'System Programming', 'Solidity,React,IPFS,Node.js', 'advanced', 1, 'https://github.com/example/d-storage', NULL, 'pending_review', 1);

-- Insert Progress Updates for Attendance System
INSERT INTO progress_updates (project_id, week_number, work_done, progress_percentage) VALUES
(1, 1, 'Created database schema, project design, and basic UI wireframes.', 20),
(1, 2, 'Implemented facial verification pipeline using OpenCV and MTCNN.', 40);

-- Insert Feedbacks for Project 1
INSERT INTO feedbacks (project_id, teacher_id, rating, comments, positive_points, areas_of_improvement, recommendations) VALUES
(1, 2, 8, 'Excellent face recognition pipeline. Recommend optimizing detection speed.', 'High accuracy, clean code structure.', 'Model inference speed under multiple faces.', 'Optimize image resizing or batching before forwarding to the neural network.');

-- Insert Meeting
INSERT INTO meetings (title, description, scheduled_at, duration_minutes, join_url, created_by, student_id) VALUES
( 'Project Architecture Discussion', 'Discussing neural net parameters and OpenCV integration.', DATE_ADD(NOW(), INTERVAL 2 DAY), 45, 'https://meet.google.com/abc-defg-hij', 3, 2);

-- Insert Chat Message
INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES
(6, 3, 'Hello Prof, I have uploaded the week 2 update. Please review.'),
(3, 6, 'Good work Bob, will review tonight.');

-- Insert Announcements
INSERT INTO announcements (title, content, target_audience, created_by) VALUES
('Final Year Project Submission Guideline', 'All final year students must submit their project abstracts by the end of next week. Submit via the dashboard.', 'students', 1),
('Faculty Evaluation Portal Open', 'Teachers can now enter marks for the mid-semester evaluation.', 'teachers', 1);
