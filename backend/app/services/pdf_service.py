"""
PDF Generation Service using ReportLab
Creates professional moving quotes with company branding
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
from decimal import Decimal
from datetime import datetime, timedelta
import qrcode
from typing import Dict, Any


def convert_decimals_to_float(obj: Any) -> Any:
    """Recursively convert Decimal objects to float for formatting"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimals_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_to_float(item) for item in obj]
    return obj


class PDFService:
    """PDF generation for quotes"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0369a1'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#0369a1'),
            spaceAfter=12,
            spaceBefore=12
        ))
    
    def generate_quote_pdf(
        self,
        quote_data: Dict[str, Any],
        company_name: str = "MoveMaster"
    ) -> BytesIO:
        """
        Generate PDF quote
        
        Args:
            quote_data: Quote information from database
            company_name: Company name for branding
        
        Returns:
            BytesIO buffer containing PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Build PDF content
        story = []
        
        # Header
        story.append(Paragraph(company_name, self.styles['CustomTitle']))
        story.append(Paragraph(
            "Umzugsangebot",
            self.styles['Heading2']
        ))
        story.append(Spacer(1, 0.5*cm))
        
        # Quote ID and Date
        quote_id = quote_data.get('id', 'N/A')
        created_at = quote_data.get('created_at', datetime.now())
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        header_data = [
            ['Angebots-ID:', quote_id[:8] + '...'],
            ['Datum:', created_at.strftime('%d.%m.%Y')],
            ['Gültig bis:', (created_at + timedelta(days=14)).strftime('%d.%m.%Y')]
        ]
        header_table = Table(header_data, colWidths=[5*cm, 10*cm])
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 1*cm))
        
        # Customer Info
        story.append(Paragraph("Kundendaten", self.styles['SectionHeader']))
        customer_data = [
            ['Name:', quote_data.get('customer_name', 'N/A')],
            ['E-Mail:', quote_data.get('customer_email', 'N/A')],
            ['Telefon:', quote_data.get('customer_phone', 'N/A')]
        ]
        customer_table = Table(customer_data, colWidths=[5*cm, 10*cm])
        customer_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        story.append(customer_table)
        story.append(Spacer(1, 0.8*cm))
        
        # Move Details
        story.append(Paragraph("Umzugsdetails", self.styles['SectionHeader']))
        origin = quote_data.get('origin_address', {})
        destination = quote_data.get('destination_address', {})
        
        move_data = [
            ['Von:', f"{origin.get('postal_code', 'N/A')} {origin.get('city', '')}"],
            ['Nach:', f"{destination.get('postal_code', 'N/A')} {destination.get('city', '')}"],
            ['Entfernung:', f"{quote_data.get('distance_km', 0):.0f} km"],
            ['Volumen:', f"{quote_data.get('volume_m3', 0):.1f} m³"],
            ['Geschätzte Dauer:', f"{quote_data.get('estimated_hours', 0):.1f} Stunden"]
        ]
        move_table = Table(move_data, colWidths=[5*cm, 10*cm])
        move_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        story.append(move_table)
        story.append(Spacer(1, 0.8*cm))
        
        # Inventory Summary
        story.append(Paragraph("Inventar", self.styles['SectionHeader']))
        # Convert Decimal values to float for formatting
        inventory = convert_decimals_to_float(quote_data.get('inventory', []))
        
        if inventory:
            inventory_data = [['Artikel', 'Menge', 'Volumen']]
            for item in inventory[:15]:  # Limit to first 15 items
                inventory_data.append([
                    item.get('name', 'N/A'),
                    str(item.get('quantity', 0)),
                    f"{item.get('volume_m3', 0):.2f} m³"
                ])
            
            if len(inventory) > 15:
                inventory_data.append(['...', f'+{len(inventory) - 15} weitere Artikel', ''])
            
            inventory_table = Table(inventory_data, colWidths=[10*cm, 3*cm, 3*cm])
            inventory_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0369a1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(inventory_table)
        else:
            story.append(Paragraph("Kein Inventar angegeben", self.styles['Normal']))
        
        story.append(Spacer(1, 0.8*cm))
        
        # Services
        # Convert Decimal values to float for formatting
        services = convert_decimals_to_float(quote_data.get('services', []))
        if services:
            story.append(Paragraph("Zusätzliche Services", self.styles['SectionHeader']))
            service_list = []
            for service in services:
                if service.get('enabled'):
                    service_name = self._translate_service(service.get('service_type', ''))
                    service_list.append(Paragraph(f"• {service_name}", self.styles['Normal']))
            for item in service_list:
                story.append(item)
            story.append(Spacer(1, 0.8*cm))
        
        # Pricing
        story.append(Paragraph("Preisübersicht", self.styles['SectionHeader']))
        min_price = quote_data.get('min_price', 0)
        max_price = quote_data.get('max_price', 0)
        
        # Price box
        price_text = f"""
        <para align=center>
        <font size=18 color="#0369a1"><b>€{int(min_price):,} - €{int(max_price):,}</b></font><br/>
        <font size=10 color="#666666">Alle Preise inkl. MwSt.</font>
        </para>
        """
        story.append(Paragraph(price_text, self.styles['Normal']))
        story.append(Spacer(1, 1*cm))
        
        # Terms & Conditions
        story.append(Paragraph("Allgemeine Geschäftsbedingungen", self.styles['SectionHeader']))
        terms = """
        • Dieses Angebot ist 14 Tage gültig<br/>
        • Der endgültige Preis kann nach Besichtigung angepasst werden<br/>
        • Zahlungsbedingungen: 50% Anzahlung, Rest nach Abschluss<br/>
        • Stornierung bis 48h vor Umzug kostenlos<br/>
        • Versicherung für Transportgüter inklusive
        """
        story.append(Paragraph(terms, self.styles['Normal']))
        story.append(Spacer(1, 1*cm))
        
        # Footer
        footer_text = """
        <para align=center>
        <font size=9 color="#666666">
        {} | Tel: +49 30 1234 5678 | Email: info@movemaster.de<br/>
        Musterstraße 123, 10115 Berlin | www.movemaster.de
        </font>
        </para>
        """.format(company_name)
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return buffer
    
    def _translate_service(self, service_type: str) -> str:
        """Translate service type to German"""
        translations = {
            'packing': 'Packservice',
            'disassembly': 'Möbelmontage',
            'hvz_permit': 'Halteverbotszone',
            'kitchen_assembly': 'Küchenmontage',
            'external_lift': 'Außenaufzug'
        }
        return translations.get(service_type, service_type)


# Singleton instance
pdf_service = PDFService()
