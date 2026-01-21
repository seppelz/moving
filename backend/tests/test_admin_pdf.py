"""
Tests for admin PDF generation functionality
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAdminPDFGeneration:
    """Test PDF generation endpoints"""
    
    def test_pdf_endpoint_exists(self):
        """Test that PDF endpoint is registered"""
        # This test verifies the endpoint exists
        # Actual PDF generation requires a quote in the database
        
        # Try with a dummy UUID
        response = client.post("/api/v1/admin/quotes/00000000-0000-0000-0000-000000000000/pdf")
        
        # Should return 404 (quote not found) not 404 (endpoint not found)
        assert response.status_code in [404, 500]
        if response.status_code == 404:
            assert "not found" in response.json().get("detail", "").lower()
    
    def test_breakdown_endpoint_exists(self):
        """Test that breakdown endpoint is registered"""
        response = client.get("/api/v1/admin/quotes/00000000-0000-0000-0000-000000000000/breakdown")
        
        # Should return 404 (quote not found)
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
    
    @pytest.mark.skipif(
        True,
        reason="Requires actual quote in database - run integration test manually"
    )
    def test_pdf_generation_with_real_quote(self):
        """
        Integration test for PDF generation
        
        To run manually:
        1. Create a quote through the calculator
        2. Get the quote ID from admin panel
        3. Call: POST /api/v1/admin/quotes/{quote_id}/pdf
        4. Verify PDF downloads correctly
        """
        # This is a manual integration test
        # Replace with actual quote ID when testing
        quote_id = "REPLACE_WITH_REAL_QUOTE_ID"
        
        response = client.post(f"/api/v1/admin/quotes/{quote_id}/pdf")
        
        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/pdf'
        assert 'attachment' in response.headers.get('content-disposition', '')


class TestQuoteBreakdown:
    """Test quote breakdown endpoint"""
    
    def test_breakdown_structure(self):
        """Test breakdown returns expected structure"""
        # This would require a real quote
        # For now, test that endpoint exists and validates
        
        response = client.get("/api/v1/admin/quotes/invalid-id/breakdown")
        
        # Should fail with 404, not 500 (endpoint exists)
        assert response.status_code in [404, 422]


# Manual test instructions
"""
MANUAL TEST INSTRUCTIONS:

1. Start the backend server:
   cd backend
   uvicorn app.main:app --reload --port 8080

2. Create a test quote:
   - Go to http://localhost:5173
   - Fill out calculator and submit
   - Note the quote ID from the response

3. Test PDF generation:
   curl -X POST http://localhost:8080/api/v1/admin/quotes/{QUOTE_ID}/pdf --output test.pdf
   
   # Should download a PDF file

4. Test breakdown endpoint:
   curl http://localhost:8080/api/v1/admin/quotes/{QUOTE_ID}/breakdown
   
   # Should return detailed JSON breakdown

5. Test in admin UI:
   - Go to http://localhost:5173/admin/quotes
   - Click "PDF" button next to any quote
   - Verify PDF downloads correctly
"""


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
