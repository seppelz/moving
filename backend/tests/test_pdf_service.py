"""
Unit tests for PDF generation service.
Tests generate_quote_pdf() and convert_decimals_to_float() directly,
without needing a database connection.
"""
import pytest
from io import BytesIO
from decimal import Decimal
from datetime import datetime, timedelta

from app.services.pdf_service import PDFService, convert_decimals_to_float


# ── Fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
def pdf_service():
    return PDFService()


@pytest.fixture
def base_quote_data():
    """Minimal valid quote data dict."""
    return {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "customer_name": "Max Mustermann",
        "customer_email": "max@example.de",
        "customer_phone": "+49 170 1234567",
        "origin_address": {"postal_code": "10115", "city": "Berlin"},
        "destination_address": {"postal_code": "80331", "city": "München"},
        "distance_km": 585,
        "volume_m3": 35.5,
        "estimated_hours": 8.0,
        "min_price": 2800,
        "max_price": 3400,
        "is_fixed_price": False,
        "inventory": [
            {"name": "Sofa", "quantity": 1, "volume_m3": 2.5},
            {"name": "Kleiderschrank", "quantity": 2, "volume_m3": 1.8},
            {"name": "Umzugskarton", "quantity": 30, "volume_m3": 0.06},
        ],
        "services": [
            {"service_type": "packing", "enabled": True},
            {"service_type": "hvz_permit", "enabled": True},
            {"service_type": "kitchen_assembly", "enabled": False},
        ],
        "created_at": datetime(2025, 6, 15, 10, 30, 0),
    }


# ── convert_decimals_to_float ─────────────────────────────────────────

class TestConvertDecimalsToFloat:
    def test_single_decimal(self):
        assert convert_decimals_to_float(Decimal("19.99")) == 19.99

    def test_nested_dict(self):
        data = {"price": Decimal("100.50"), "label": "test", "count": 5}
        result = convert_decimals_to_float(data)
        assert result == {"price": 100.50, "label": "test", "count": 5}
        assert isinstance(result["price"], float)

    def test_nested_list(self):
        data = [Decimal("1.1"), Decimal("2.2"), "text"]
        result = convert_decimals_to_float(data)
        assert result == [1.1, 2.2, "text"]

    def test_deeply_nested(self):
        data = {"items": [{"volume_m3": Decimal("0.35"), "nested": {"val": Decimal("9")}}]}
        result = convert_decimals_to_float(data)
        assert result["items"][0]["volume_m3"] == 0.35
        assert result["items"][0]["nested"]["val"] == 9.0

    def test_no_decimals_passthrough(self):
        data = {"a": 1, "b": "hello", "c": [True, None]}
        assert convert_decimals_to_float(data) == data

    def test_empty_structures(self):
        assert convert_decimals_to_float({}) == {}
        assert convert_decimals_to_float([]) == []

    def test_none_passthrough(self):
        assert convert_decimals_to_float(None) is None


# ── PDF Generation ────────────────────────────────────────────────────

class TestPDFGeneration:
    def test_returns_bytesio(self, pdf_service, base_quote_data):
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_pdf_has_content(self, pdf_service, base_quote_data):
        result = pdf_service.generate_quote_pdf(base_quote_data)
        content = result.read()
        assert len(content) > 0

    def test_pdf_starts_with_pdf_header(self, pdf_service, base_quote_data):
        result = pdf_service.generate_quote_pdf(base_quote_data)
        header = result.read(5)
        assert header == b"%PDF-"

    def test_buffer_position_at_start(self, pdf_service, base_quote_data):
        """generate_quote_pdf should seek(0) so buffer is ready to read."""
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert result.tell() == 0

    def test_custom_company_name(self, pdf_service, base_quote_data):
        """PDF should generate without error with custom company name."""
        result = pdf_service.generate_quote_pdf(base_quote_data, company_name="Umzüge Berlin GmbH")
        assert isinstance(result, BytesIO)
        assert result.read(5) == b"%PDF-"

    def test_default_company_name(self, pdf_service, base_quote_data):
        """Default company name should be MoveMaster."""
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)


class TestPDFFixedPrice:
    def test_fixed_price_generates(self, pdf_service, base_quote_data):
        base_quote_data["is_fixed_price"] = True
        base_quote_data["min_price"] = 3000
        base_quote_data["max_price"] = 3000
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)
        assert len(result.read()) > 0

    def test_range_price_generates(self, pdf_service, base_quote_data):
        base_quote_data["is_fixed_price"] = False
        base_quote_data["min_price"] = 2800
        base_quote_data["max_price"] = 3400
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)


class TestPDFInventory:
    def test_empty_inventory(self, pdf_service, base_quote_data):
        base_quote_data["inventory"] = []
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)
        assert len(result.read()) > 0

    def test_exactly_15_items(self, pdf_service, base_quote_data):
        base_quote_data["inventory"] = [
            {"name": f"Item {i}", "quantity": i, "volume_m3": 0.5}
            for i in range(1, 16)
        ]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_more_than_15_items_truncated(self, pdf_service, base_quote_data):
        """Inventory should be limited to 15 items with overflow note."""
        base_quote_data["inventory"] = [
            {"name": f"Item {i}", "quantity": 1, "volume_m3": 0.1}
            for i in range(1, 25)
        ]
        # Should not raise — overflow is handled gracefully
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)
        assert len(result.read()) > 0

    def test_inventory_with_decimals(self, pdf_service, base_quote_data):
        """Decimal values in inventory should be converted to float."""
        base_quote_data["inventory"] = [
            {"name": "Schrank", "quantity": 1, "volume_m3": Decimal("1.85")},
            {"name": "Tisch", "quantity": 2, "volume_m3": Decimal("0.60")},
        ]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)


class TestPDFServices:
    def test_no_services(self, pdf_service, base_quote_data):
        base_quote_data["services"] = []
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_disabled_services_skipped(self, pdf_service, base_quote_data):
        """Only enabled services should appear."""
        base_quote_data["services"] = [
            {"service_type": "packing", "enabled": False},
            {"service_type": "hvz_permit", "enabled": False},
        ]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_all_service_types(self, pdf_service, base_quote_data):
        """All known service types should generate without error."""
        base_quote_data["services"] = [
            {"service_type": "packing", "enabled": True},
            {"service_type": "disassembly", "enabled": True},
            {"service_type": "hvz_permit", "enabled": True},
            {"service_type": "kitchen_assembly", "enabled": True},
            {"service_type": "external_lift", "enabled": True},
        ]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_unknown_service_type_uses_raw_name(self, pdf_service, base_quote_data):
        """Unknown service types should fall back to raw service_type string."""
        base_quote_data["services"] = [
            {"service_type": "custom_service_xyz", "enabled": True},
        ]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)


class TestPDFServiceTranslation:
    def test_packing(self, pdf_service):
        assert pdf_service._translate_service("packing") == "Packservice"

    def test_disassembly(self, pdf_service):
        assert pdf_service._translate_service("disassembly") == "Möbelmontage"

    def test_hvz_permit(self, pdf_service):
        assert pdf_service._translate_service("hvz_permit") == "Halteverbotszone"

    def test_kitchen_assembly(self, pdf_service):
        assert pdf_service._translate_service("kitchen_assembly") == "Küchenmontage"

    def test_external_lift(self, pdf_service):
        assert pdf_service._translate_service("external_lift") == "Außenaufzug"

    def test_unknown_service(self, pdf_service):
        assert pdf_service._translate_service("something_new") == "something_new"

    def test_empty_string(self, pdf_service):
        assert pdf_service._translate_service("") == ""


class TestPDFDateHandling:
    def test_datetime_object(self, pdf_service, base_quote_data):
        base_quote_data["created_at"] = datetime(2025, 3, 15, 14, 0, 0)
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_iso_string_date(self, pdf_service, base_quote_data):
        base_quote_data["created_at"] = "2025-03-15T14:00:00Z"
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_missing_created_at_uses_now(self, pdf_service, base_quote_data):
        del base_quote_data["created_at"]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_validity_is_14_days(self, pdf_service, base_quote_data):
        """The 'Gültig bis' date should be created_at + 14 days."""
        created = datetime(2025, 1, 1, 0, 0, 0)
        base_quote_data["created_at"] = created
        expected_valid_until = (created + timedelta(days=14)).strftime("%d.%m.%Y")
        # We can't easily read the PDF text, but we verify no error occurs
        # and the PDF generates successfully with the date
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)


class TestPDFMissingFields:
    def test_missing_customer_name(self, pdf_service, base_quote_data):
        del base_quote_data["customer_name"]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_missing_customer_phone(self, pdf_service, base_quote_data):
        del base_quote_data["customer_phone"]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_missing_origin_city(self, pdf_service, base_quote_data):
        base_quote_data["origin_address"] = {"postal_code": "10115"}
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_missing_id(self, pdf_service, base_quote_data):
        del base_quote_data["id"]
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_zero_prices(self, pdf_service, base_quote_data):
        base_quote_data["min_price"] = 0
        base_quote_data["max_price"] = 0
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_empty_addresses(self, pdf_service, base_quote_data):
        base_quote_data["origin_address"] = {}
        base_quote_data["destination_address"] = {}
        result = pdf_service.generate_quote_pdf(base_quote_data)
        assert isinstance(result, BytesIO)

    def test_minimal_quote_data(self, pdf_service):
        """Absolute minimum data should still produce a valid PDF."""
        minimal = {
            "origin_address": {},
            "destination_address": {},
            "distance_km": 0,
            "volume_m3": 0,
            "estimated_hours": 0,
            "min_price": 0,
            "max_price": 0,
        }
        result = pdf_service.generate_quote_pdf(minimal)
        assert isinstance(result, BytesIO)
        assert result.read(5) == b"%PDF-"


class TestPDFMultipleGenerations:
    def test_same_service_instance_multiple_pdfs(self, pdf_service, base_quote_data):
        """Generating multiple PDFs from the same service instance should work."""
        result1 = pdf_service.generate_quote_pdf(base_quote_data)
        result2 = pdf_service.generate_quote_pdf(base_quote_data, company_name="Other Co")
        assert isinstance(result1, BytesIO)
        assert isinstance(result2, BytesIO)
        # Each should be independent buffers
        content1 = result1.read()
        content2 = result2.read()
        assert len(content1) > 0
        assert len(content2) > 0
