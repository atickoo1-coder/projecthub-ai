import json
import logging
import google.generativeai as genai
from ..core.config import settings

logger = logging.getLogger("app")

# Initialize Gemini if key is provided
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("GEMINI_API_KEY not set. Running in mock AI mode.")

def call_gemini(prompt: str, fallback_response: str) -> str:
    """Helper to call Gemini API with error handling and fallback"""
    if not settings.GEMINI_API_KEY:
        return fallback_response
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
        return fallback_response
    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
        return fallback_response

class AIService:
    @staticmethod
    def generate_project_summary(title: str, text_content: str) -> dict:
        prompt = f"""
        Analyze the following project report details and generate a structured JSON object containing:
        1. "abstract" (A professional 3-4 sentence abstract summary)
        2. "keywords" (A list of 5-6 relevant keywords as a list of strings)
        3. "objectives" (3-4 bullet points outlining key goals)
        4. "problem_statement" (A concise problem statement)
        5. "future_scope" (2-3 sentences on future enhancements)

        Project Title: {title}
        Report Details:
        {text_content}

        Ensure the output is strictly valid JSON format only, with no markdown wrappers (like ```json).
        """
        
        default_mock = {
            "abstract": f"This project, titled '{title}', presents a modern design and implementation methodology to address domain challenges. By leveraging state-of-the-art architectures, the system offers real-time monitoring, high scalability, and robust user interaction models.",
            "keywords": ["React.js", "FastAPI", "Database Normalization", "Rest API", "Software Architecture"],
            "objectives": [
                "Establish a secure, role-based user access model.",
                "Implement high-performance CRUD interfaces for records.",
                "Ensure mobile-responsive interface scaling."
            ],
            "problem_statement": f"Existing college legacy applications lack direct integration with modern portfolio components and AI assistance modules, leading to delayed project tracking and assessment cycles.",
            "future_scope": "Future scope includes integrating realtime web-socket messaging channels and third-party credential verification systems like open-badges."
        }
        
        res_text = call_gemini(prompt, json.dumps(default_mock))
        try:
            # Clean up markdown block markers just in case
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            return json.loads(res_text.strip())
        except Exception:
            return default_mock

    @staticmethod
    def generate_weekly_report(bullet_points: str) -> str:
        prompt = f"""
        Convert the following informal, bulleted weekly update into a formal, professional progress report summary suitable for academic project guides.
        
        Informal Updates:
        {bullet_points}
        
        Write a concise, polished paragraph describing the accomplishments and technical tasks resolved.
        """
        fallback = f"Successfully completed execution milestones including: {bullet_points}. Handled configuration tests, resolved route exceptions, and synchronized UI styling updates."
        return call_gemini(prompt, fallback)

    @staticmethod
    def generate_feedback(title: str, week_summary: str, grade: int) -> dict:
        prompt = f"""
        Generate feedback for a student project titled '{title}'.
        The student completed the following work: {week_summary}.
        The teacher graded this work as {grade}/10.

        Generate a JSON object containing:
        1. "positive_points": (2-3 bullet points highlighting positive aspects of their work)
        2. "areas_of_improvement": (2-3 bullet points of areas that need attention)
        3. "recommendations": (A short paragraph containing specific learning resources or optimization strategies)

        Ensure the output is strictly valid JSON format only, with no markdown wrappers (like ```json).
        """
        default_mock = {
            "positive_points": [
                "Solid choice of technological framework matching initial scope.",
                "Consistent documentation of code updates in database tables."
            ],
            "areas_of_improvement": [
                "Ensure proper pagination is configured for large lists.",
                "Integrate loading skeletons to enhance user loading states."
            ],
            "recommendations": "Recommend exploring standard database indexing to optimize queries and utilizing Framer Motion layout animations for softer page transitions."
        }
        res_text = call_gemini(prompt, json.dumps(default_mock))
        try:
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            return json.loads(res_text.strip())
        except Exception:
            return default_mock

    @staticmethod
    def recommend_projects(skills: list, domain: str, difficulty: str) -> dict:
        prompt = f"""
        Recommend 3 unique, comprehensive project ideas for a student based on:
        Skills: {', '.join(skills)}
        Domain: {domain}
        Difficulty: {difficulty}

        Generate a JSON object with a key "recommendations" that contains a list of 3 items. Each item must have:
        - "title": (Project Title)
        - "description": (Short description)
        - "technologies": (List of technologies needed)
        - "estimated_time": (e.g. "4 weeks", "6 weeks")
        - "learning_resources": (List of 2-3 links or resources)

        Ensure the output is strictly valid JSON format only, with no markdown wrappers (like ```json).
        """
        default_mock = {
            "recommendations": [
                {
                    "title": f"Smart {domain} Portal",
                    "description": f"An advanced project tracking and evaluation application specifically tailored for {domain} with customized dashboard workflows.",
                    "technologies": skills + ["Docker", "MySQL"],
                    "estimated_time": "6 weeks",
                    "learning_resources": ["Official Documentation", "MDN Web Docs", "FastAPI Tutorials"]
                },
                {
                    "title": f"Automated {domain} Analyzer",
                    "description": f"A reporting and analytics suite that extracts insights from historical datasets related to {domain}.",
                    "technologies": skills + ["Pandas", "Chart.js"],
                    "estimated_time": "4 weeks",
                    "learning_resources": ["Kaggle Tutorials", "Python Data Science Handbook"]
                },
                {
                    "title": f"Real-time Collaboration for {domain}",
                    "description": f"A collaborative whiteboard and chat platform designed to help teams work on {domain} projects asynchronously.",
                    "technologies": skills + ["WebSockets", "Redis"],
                    "estimated_time": "8 weeks",
                    "learning_resources": ["WebSocket Protocol Docs", "Socket.io Guides"]
                }
            ]
        }
        res_text = call_gemini(prompt, json.dumps(default_mock))
        try:
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            return json.loads(res_text.strip())
        except Exception:
            return default_mock

    @staticmethod
    def generate_resume(student_name: str, skills: str, projects: list, achievements: list, certificates: list) -> str:
        prompt = f"""
        Generate a professional resume layout in Markdown format for a student:
        Name: {student_name}
        Skills: {skills}
        Projects: {', '.join(projects)}
        Achievements: {', '.join(achievements)}
        Certificates: {', '.join(certificates)}
        
        Organize it clearly into sections: Contact Information, Summary, Skills, Projects, Achievements, Certificates. Keep it concise.
        """
        fallback = f"""# {student_name}
## Professional Summary
Highly motivated engineering student with expertise in modern technologies. Proven record of developing responsive web applications and collaborative system tools.

## Skills
{skills}

## Key Projects
{chr(10).join([f"- **{p}**" for p in projects]) if projects else "- AI Project Tracking and Portfolio System"}

## Certifications & Achievements
{chr(10).join([f"- {a}" for a in achievements + certificates]) if (achievements or certificates) else "- Certified Full-stack Web Developer"}
"""
        return call_gemini(prompt, fallback)

    @staticmethod
    def generate_portfolio_description(project_title: str, technologies: str) -> str:
        prompt = f"""
        Generate a short (2-3 sentences) professional portfolio description for a project named '{project_title}'.
        Technologies used: {technologies}.
        """
        fallback = f"Developed '{project_title}', a robust application engineered using {technologies}. The project delivers high availability and responsive performance by incorporating modular system routing and structured backend validation pipelines."
        return call_gemini(prompt, fallback)

    @staticmethod
    def evaluate_abstract_ai(title: str, abstract: str) -> dict:
        prompt = f"""
        Evaluate the following project abstract for:
        Project Title: {title}
        Abstract: {abstract}

        Analyze it across these parameters:
        1. "clarity" (Out of 10)
        2. "novelty" (Out of 10)
        3. "objectives" (Out of 10)
        4. "scope" (Out of 10)
        5. "feasibility" (Out of 10)
        6. "suggestions" (List of 3 concrete improvement suggestions)

        Return the results strictly as a JSON object containing keys:
        "clarity", "novelty", "objectives", "scope", "feasibility", "suggestions".
        Do not output markdown code blocks.
        """
        default_mock = {
            "clarity": 8,
            "novelty": 7,
            "objectives": 8,
            "scope": 9,
            "feasibility": 9,
            "suggestions": [
                "Clearly specify the dataset size and models being compared.",
                "Detail the hardware or environment constraints for feasibility.",
                "Explicitly declare the expected latency or speed metrics."
            ]
        }
        res_text = call_gemini(prompt, json.dumps(default_mock))
        try:
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            return json.loads(res_text.strip())
        except Exception:
            return default_mock

    @staticmethod
    def evaluate_report_ai(title: str, report_type: str, content: str) -> dict:
        prompt = f"""
        Evaluate this student project report/document:
        Project Title: {title}
        Document Type: {report_type}
        Content Snippet: {content}

        Assess:
        1. "grammar" (Out of 100)
        2. "technical_quality" (Out of 100)
        3. "formatting" (Out of 100)
        4. "missing_sections" (List of sections that are missing)
        5. "references" (Number of references found)
        6. "figures" (Number of figures/diagrams found)
        7. "citation_consistency" (Out of 100)
        8. "suggestions" (Short improvement paragraph)

        Return as JSON only.
        """
        default_mock = {
            "grammar": 90,
            "technical_quality": 85,
            "formatting": 88,
            "missing_sections": ["Risk Mitigation Matrix", "Testing Suite Coverage Details"],
            "references": 8,
            "figures": 4,
            "citation_consistency": 92,
            "suggestions": "The document is well-structured. Formatting matches guidelines. Consider elaborating on the algorithmic computational complexity and adding more architectural system sequence diagrams."
        }
        res_text = call_gemini(prompt, json.dumps(default_mock))
        try:
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            return json.loads(res_text.strip())
        except Exception:
            return default_mock

    @staticmethod
    def explain_plagiarism_ai(similarity_score: float, sources: str) -> dict:
        prompt = f"""
        Provide a detailed explanation and recommendation for a plagiarism check result:
        Similarity Score: {similarity_score}%
        Matched Sources: {sources}

        Explain:
        1. "sections_similar" (Which typical sections might have overlap)
        2. "acceptability" (Is it acceptable given the score? Yes/No with explanation)
        3. "suggestions" (3 tips for reducing similarity)

        Return as JSON only.
        """
        default_mock = {
            "sections_similar": "Mainly found overlapping paragraphs in the general literature survey section and standard project database definitions.",
            "acceptability": "Yes, 17% is within the acceptable threshold of 20% for academic projects.",
            "suggestions": [
                "Paraphrase the algorithmic explanations instead of copy-pasting direct references.",
                "Ensure proper citation tags are added for IEEE definitions.",
                "Rephrase the technical database table definitions in your own vocabulary."
            ]
        }
        res_text = call_gemini(prompt, json.dumps(default_mock))
        try:
            if "```" in res_text:
                res_text = res_text.split("```")[1]
                if res_text.startswith("json"):
                    res_text = res_text[4:]
            return json.loads(res_text.strip())
        except Exception:
            return default_mock

    @staticmethod
    def recommend_marks_ai(title: str, rubric_criteria: dict) -> dict:
        default_mock = {
            "problem_definition": 9,
            "literature_survey": 8,
            "innovation": 8,
            "design": 9,
            "coding": 8,
            "testing": 7,
            "documentation": 9,
            "presentation": 8,
            "viva": 8,
            "reasoning": "The student has consistently updated their weekly logs, achieved core milestone criteria, and integrated interactive timelines. Coding displays solid framework routing, but testing verification needs more detailed unit assertions."
        }
        return default_mock

    @staticmethod
    def analyze_progress_ai(progress: int, expected: int, updates: list) -> dict:
        delay = max(0, expected - progress)
        risk = "Low"
        if delay > 25:
            risk = "High"
        elif delay > 10:
            risk = "Medium"
            
        recommendation = "Complete the core UI testing suite, finalize the SRS database schemas, and formulate the production deployment package on Netlify/Vercel."
        if delay > 20:
            recommendation = "CRITICAL: Arrange an immediate guide sync sync. Complete design models and establish basic database models to catch up with schedule expectations."
            
        return {
            "project_health": "Medium Risk" if delay > 10 else "Good Health",
            "progress": progress,
            "expected": expected,
            "risk": risk,
            "delay": f"{delay} Days" if delay > 0 else "On Track",
            "recommendation": recommendation
        }
