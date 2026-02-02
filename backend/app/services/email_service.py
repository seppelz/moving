"""
Email Service for automated quote notifications
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Optional
from app.core.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Email automation for quote notifications"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_USER or "noreply@movemaster.de"
    
    def _create_connection(self):
        """Create SMTP connection"""
        if not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP not configured, email will be logged only")
            return None
        
        try:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Failed to connect to SMTP: {e}")
            return None
    
    def send_quote_confirmation(
        self,
        to_email: str,
        customer_name: Optional[str],
        quote_id: str,
        min_price: float,
        max_price: float
    ) -> bool:
        """
        Send instant confirmation email after quote submission
        """
        subject = "Ihr Umzugsangebot von MoveMaster"
        
        name = customer_name or "Kunde"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0369a1; color: white; padding: 30px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; }}
                .price-box {{ background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); 
                             color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; }}
                .price {{ font-size: 36px; font-weight: bold; margin: 10px 0; }}
                .btn {{ background-color: #0369a1; color: white; padding: 15px 30px; 
                       text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }}
                ul {{ text-align: left; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>MoveMaster</h1>
                    <p>Ihr Umzug, vereinfacht</p>
                </div>
                
                <div class="content">
                    <h2>Vielen Dank, {name}!</h2>
                    <p>Wir haben Ihre Umzugsanfrage erhalten und freuen uns, Ihnen folgendes Angebot zu unterbreiten:</p>
                    
                    <div class="price-box">
                        <div style="font-size: 18px; opacity: 0.9;">Geschätzter Preis</div>
                        <div class="price">€{int(min_price):,} - €{int(max_price):,}</div>
                        <div style="opacity: 0.8;">Alle Preise inkl. MwSt.</div>
                    </div>
                    
                    <h3>Nächste Schritte:</h3>
                    <ul>
                        <li>Unser Team prüft Ihre Anfrage im Detail</li>
                        <li>Sie erhalten innerhalb von 24 Stunden ein verbindliches Angebot</li>
                        <li>Bei Fragen können Sie uns jederzeit kontaktieren</li>
                    </ul>
                    
                    <p><strong>Ihre Angebots-ID:</strong> {quote_id[:16]}...</p>
                    
                    <center>
                        <a href="https://movemaster.de/quote/{quote_id}" class="btn">Angebot ansehen</a>
                    </center>
                </div>
                
                <div class="footer">
                    <p><strong>MoveMaster GmbH</strong></p>
                    <p>Musterstraße 123, 10115 Berlin<br/>
                    Tel: +49 30 1234 5678 | Email: info@movemaster.de</p>
                    <p style="font-size: 12px; margin-top: 20px;">
                        Sie erhalten diese E-Mail, weil Sie ein Umzugsangebot bei uns angefordert haben.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_body)
    
    def send_pdf_quote(
        self,
        to_email: str,
        customer_name: Optional[str],
        pdf_url: str,
        pdf_attachment: Optional[bytes] = None
    ) -> bool:
        """
        Send formal PDF quote
        """
        subject = "Ihr detailliertes Umzugsangebot"
        
        name = customer_name or "Kunde"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0369a1; color: white; padding: 30px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; }}
                .btn {{ background-color: #0369a1; color: white; padding: 15px 30px; 
                       text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Ihr detailliertes Angebot</h1>
                </div>
                
                <div class="content">
                    <h2>Guten Tag, {name}!</h2>
                    <p>Anbei finden Sie Ihr detailliertes Umzugsangebot als PDF.</p>
                    
                    <p>Das Angebot ist <strong>14 Tage gültig</strong>.</p>
                    
                    <p>Um das Angebot anzunehmen oder bei Fragen, kontaktieren Sie uns bitte:</p>
                    <ul>
                        <li>Telefon: +49 30 1234 5678</li>
                        <li>E-Mail: info@movemaster.de</li>
                    </ul>
                    
                    <center>
                        <a href="{pdf_url}" class="btn">PDF herunterladen</a>
                    </center>
                </div>
                
                <div class="footer">
                    <p><strong>MoveMaster GmbH</strong></p>
                    <p>Musterstraße 123, 10115 Berlin</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(
            to_email,
            subject,
            html_body,
            attachment=pdf_attachment,
            attachment_name="Umzugsangebot.pdf"
        )
    
    def send_follow_up(
        self,
        to_email: str,
        customer_name: Optional[str],
        quote_id: str
    ) -> bool:
        """
        Send follow-up email 24 hours after quote
        """
        subject = "Haben Sie Fragen zu Ihrem Umzugsangebot?"
        
        name = customer_name or "Kunde"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #0369a1; color: white; padding: 30px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Wir sind für Sie da!</h1>
                </div>
                
                <div class="content">
                    <h2>Guten Tag, {name}!</h2>
                    <p>Vor kurzem haben Sie ein Umzugsangebot bei uns angefordert. 
                    Haben Sie Fragen dazu?</p>
                    
                    <p>Wir helfen Ihnen gerne weiter:</p>
                    <ul>
                        <li>☎ Telefonisch: +49 30 1234 5678 (Mo-Fr, 8-18 Uhr)</li>
                        <li>✉ Per E-Mail: info@movemaster.de</li>
                        <li>💭 Live-Chat auf unserer Website</li>
                    </ul>
                    
                    <h3>Häufige Fragen:</h3>
                    <p><strong>Kann der Preis noch angepasst werden?</strong><br/>
                    Ja, nach einer kostenlosen Besichtigung erstellen wir ein verbindliches Angebot.</p>
                    
                    <p><strong>Welche Versicherung ist enthalten?</strong><br/>
                    Alle Transportgüter sind automatisch bis €100.000 versichert.</p>
                    
                    <p><strong>Kann ich meinen Umzugstermin verschieben?</strong><br/>
                    Ja, bis 48 Stunden vor dem Termin kostenfrei.</p>
                </div>
                
                <div class="footer">
                    <p><strong>MoveMaster GmbH</strong></p>
                    <p>Musterstraße 123, 10115 Berlin</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_body)
    
    def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        attachment: Optional[bytes] = None,
        attachment_name: Optional[str] = None
    ) -> bool:
        """
        Internal method to send email
        """
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.from_email
        msg['To'] = to_email
        msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
        
        # Attach HTML body
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Attach PDF if provided
        if attachment and attachment_name:
            pdf_part = MIMEApplication(attachment, _subtype='pdf')
            pdf_part.add_header('Content-Disposition', 'attachment', filename=attachment_name)
            msg.attach(pdf_part)
        
        # Send email
        server = self._create_connection()
        
        if server:
            try:
                server.send_message(msg)
                server.quit()
                logger.info(f"✓ Email sent to {to_email}")
                return True
            except Exception as e:
                logger.error(f"✗ Failed to send email: {e}")
                return False
        else:
            # Log email if SMTP not configured (development)
            logger.info(f"[EMAIL LOG] To: {to_email}")
            logger.info(f"[EMAIL LOG] Subject: {subject}")
            logger.info(f"[EMAIL LOG] Body preview: {html_body[:200]}...")
            return True


# Singleton instance
email_service = EmailService()
