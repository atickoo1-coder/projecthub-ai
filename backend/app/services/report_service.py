import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportService:
    @staticmethod
    def export_csv(data: list[dict]) -> bytes:
        if not data:
            return b""
        df = pd.DataFrame(data)
        return df.to_csv(index=False).encode('utf-8')

    @staticmethod
    def export_excel(data: list[dict], sheet_name: str = "Report") -> bytes:
        if not data:
            return b""
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        return output.getvalue()

    @staticmethod
    def export_pdf(title: str, headers: list[str], rows: list[list]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=15
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=12
        )
        
        # Title
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 15))
        
        # Prepare table data
        table_data = [headers]
        for row in rows:
            # Wrap cell contents in Paragraphs to enable autowrap
            wrapped_row = [Paragraph(str(cell), body_style) for cell in row]
            table_data.append(wrapped_row)
            
        t = Table(table_data, colWidths=[(doc.width / len(headers))] * len(headers))
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 11),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F3F4F6')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E5E7EB')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        
        doc.build(story)
        return buffer.getvalue()
