import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from ..core.config import settings

logger = logging.getLogger("app")

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str) -> bool:
        """Sends an email notification via SMTP, falling back to logging if unconfigured"""
        logger.info(f"[EMAIL SENDING] To: {to_email} | Subject: {subject}")
        logger.info(f"[EMAIL BODY]\n{body}\n----------------------")
        
        # Check if settings are configured
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.info("SMTP configuration not fully completed. Email logged to console.")
            return True
            
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
            server.close()
            logger.info(f"Email sent successfully to {to_email}.")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {str(e)}")
            return False

    @staticmethod
    def send_approval_notification(to_email: str, student_name: str, project_title: str):
        subject = f"Project Approved: {project_title}"
        body = f"""
        <html>
            <body>
                <h3>Dear {student_name},</h3>
                <p>We are pleased to inform you that your project proposal titled <b>"{project_title}"</b> has been <b>approved</b> by your guide.</p>
                <p>You can now begin updating your weekly progress updates on the ProjectHub AI dashboard.</p>
                <br/>
                <p>Best regards,<br/>ProjectHub AI Admin</p>
            </body>
        </html>
        """
        EmailService.send_email(to_email, subject, body)

    @staticmethod
    def send_feedback_notification(to_email: str, student_name: str, project_title: str, teacher_name: str):
        subject = f"New Feedback Received: {project_title}"
        body = f"""
        <html>
            <body>
                <h3>Dear {student_name},</h3>
                <p>Your project guide, <b>{teacher_name}</b>, has provided new feedback and markings for your project <b>"{project_title}"</b>.</p>
                <p>Please log into your dashboard to read the comments and make adjustments if requested.</p>
                <br/>
                <p>Best regards,<br/>ProjectHub AI Admin</p>
            </body>
        </html>
        """
        EmailService.send_email(to_email, subject, body)
        
    @staticmethod
    def send_deadline_reminder(to_email: str, student_name: str, project_title: str, deadline_date: str):
        subject = f"Project Deadline Reminder: {project_title}"
        body = f"""
        <html>
            <body>
                <h3>Dear {student_name},</h3>
                <p>This is a friendly reminder that a deadline is approaching for your project <b>"{project_title}"</b>.</p>
                <p>Target Deadline: <b>{deadline_date}</b></p>
                <p>Please submit your report, progress updates, or code artifacts before the target date.</p>
                <br/>
                <p>Best regards,<br/>ProjectHub AI Admin</p>
            </body>
        </html>
        """
        EmailService.send_email(to_email, subject, body)
