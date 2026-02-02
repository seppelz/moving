"""
Service for managing quote lifecycle and transitions
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.quote import Quote, QuoteStatus

logger = logging.getLogger(__name__)

class QuoteService:
    """Service for quote-related business logic"""

    def auto_expire_quotes(self, db: Session) -> int:
        """
        Finds quotes older than 14 days that are still in 'draft' or 'sent' status
        and marks them as 'expired'.
        Returns the number of expired quotes.
        """
        expiry_date = datetime.utcnow() - timedelta(days=14)
        
        # Find quotes to expire
        expired_quotes = db.query(Quote).filter(
            Quote.status.in_([QuoteStatus.DRAFT, QuoteStatus.SENT]),
            Quote.created_at < expiry_date
        ).all()
        
        count = len(expired_quotes)
        if count > 0:
            logger.info(f"AUTO_EXPIRE: Found {count} quotes older than 14 days. Marking as expired.")
            for quote in expired_quotes:
                quote.status = QuoteStatus.EXPIRED
                quote.updated_at = datetime.utcnow()
            
            try:
                db.commit()
                logger.info(f"✓ SUCCESSFULLY expired {count} quotes")
            except Exception as e:
                db.rollback()
                logger.error(f"✗ FAILED to expire quotes: {e}")
                return 0
        
        return count

quote_service = QuoteService()
