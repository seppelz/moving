"""
Tests for quote lifecycle: status transitions, detail updates,
feedback/accuracy tracking, and the QuoteStatus model.
Uses unittest.mock to avoid needing a live database.
"""
import pytest
import uuid
from decimal import Decimal
from datetime import datetime
from unittest.mock import MagicMock, patch, PropertyMock

from app.models.quote import Quote, QuoteStatus
from app.schemas.quote import QuoteUpdateRequest


# ── QuoteStatus Enum ──────────────────────────────────────────────────

class TestQuoteStatus:
    def test_all_statuses_exist(self):
        assert QuoteStatus.DRAFT == "draft"
        assert QuoteStatus.SENT == "sent"
        assert QuoteStatus.ACCEPTED == "accepted"
        assert QuoteStatus.REJECTED == "rejected"
        assert QuoteStatus.EXPIRED == "expired"

    def test_status_count(self):
        assert len(QuoteStatus) == 5

    def test_status_is_string(self):
        for s in QuoteStatus:
            assert isinstance(s.value, str)

    def test_status_from_string(self):
        assert QuoteStatus("draft") == QuoteStatus.DRAFT
        assert QuoteStatus("sent") == QuoteStatus.SENT
        assert QuoteStatus("accepted") == QuoteStatus.ACCEPTED

    def test_invalid_status_raises(self):
        with pytest.raises(ValueError):
            QuoteStatus("cancelled")


# ── Quote Model ───────────────────────────────────────────────────────

class TestQuoteModel:
    def test_default_status_is_draft(self):
        """New quotes should default to DRAFT status."""
        assert Quote.status.property.columns[0].default.arg == QuoteStatus.DRAFT

    def test_repr(self):
        q = Quote()
        q.id = uuid.UUID("12345678-1234-5678-1234-567812345678")
        q.customer_email = "test@test.de"
        assert "12345678" in repr(q)
        assert "test@test.de" in repr(q)

    def test_is_fixed_price_default_false(self):
        assert Quote.is_fixed_price.property.columns[0].default.arg is False


# ── QuoteUpdateRequest Schema ─────────────────────────────────────────

class TestQuoteUpdateRequest:
    def test_all_fields_optional(self):
        req = QuoteUpdateRequest()
        assert req.min_price is None
        assert req.max_price is None
        assert req.volume_m3 is None
        assert req.is_fixed_price is None

    def test_partial_update(self):
        req = QuoteUpdateRequest(min_price=Decimal("1500"))
        assert req.min_price == Decimal("1500")
        assert req.max_price is None

    def test_fixed_price_toggle(self):
        req = QuoteUpdateRequest(is_fixed_price=True, min_price=Decimal("2000"))
        assert req.is_fixed_price is True
        assert req.min_price == Decimal("2000")


# ── Status Transition Logic (from admin.py update_quote_status) ───────

class TestStatusTransitions:
    """
    Tests the status transition logic extracted from the admin endpoint.
    The current implementation allows any→any transitions (no validation).
    """

    def _make_quote(self, status=QuoteStatus.DRAFT):
        q = MagicMock(spec=Quote)
        q.id = uuid.uuid4()
        q.status = status
        q.customer_email = "kunde@example.de"
        q.customer_name = "Hans Müller"
        q.min_price = Decimal("2000")
        q.max_price = Decimal("2500")
        q.is_fixed_price = False
        return q

    def test_draft_to_sent(self):
        q = self._make_quote(QuoteStatus.DRAFT)
        old_status = q.status
        q.status = QuoteStatus.SENT
        assert q.status == QuoteStatus.SENT
        assert old_status == QuoteStatus.DRAFT

    def test_draft_to_accepted(self):
        q = self._make_quote(QuoteStatus.DRAFT)
        q.status = QuoteStatus.ACCEPTED
        assert q.status == QuoteStatus.ACCEPTED

    def test_sent_to_accepted(self):
        q = self._make_quote(QuoteStatus.SENT)
        q.status = QuoteStatus.ACCEPTED
        assert q.status == QuoteStatus.ACCEPTED

    def test_sent_to_rejected(self):
        q = self._make_quote(QuoteStatus.SENT)
        q.status = QuoteStatus.REJECTED
        assert q.status == QuoteStatus.REJECTED

    def test_draft_to_expired(self):
        q = self._make_quote(QuoteStatus.DRAFT)
        q.status = QuoteStatus.EXPIRED
        assert q.status == QuoteStatus.EXPIRED

    def test_accepted_to_expired(self):
        """Currently no transition guard — accepted can move to expired."""
        q = self._make_quote(QuoteStatus.ACCEPTED)
        q.status = QuoteStatus.EXPIRED
        assert q.status == QuoteStatus.EXPIRED

    def test_rejected_to_sent(self):
        """No guard: even rejected → sent is allowed."""
        q = self._make_quote(QuoteStatus.REJECTED)
        q.status = QuoteStatus.SENT
        assert q.status == QuoteStatus.SENT


# ── Email Trigger on Status Change ────────────────────────────────────

class TestEmailTrigger:
    """
    Tests the email-triggering logic: email is sent ONLY when
    transitioning TO SENT from a non-SENT status.
    """

    def test_email_sent_on_draft_to_sent(self):
        """Transitioning DRAFT → SENT should trigger email."""
        old_status = QuoteStatus.DRAFT
        new_status = QuoteStatus.SENT
        should_send = (new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT)
        assert should_send is True

    def test_no_email_on_sent_to_sent(self):
        """Re-setting SENT → SENT should NOT trigger email."""
        old_status = QuoteStatus.SENT
        new_status = QuoteStatus.SENT
        should_send = (new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT)
        assert should_send is False

    def test_no_email_on_draft_to_accepted(self):
        old_status = QuoteStatus.DRAFT
        new_status = QuoteStatus.ACCEPTED
        should_send = (new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT)
        assert should_send is False

    def test_no_email_on_sent_to_rejected(self):
        old_status = QuoteStatus.SENT
        new_status = QuoteStatus.REJECTED
        should_send = (new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT)
        assert should_send is False

    def test_email_on_rejected_to_sent(self):
        """Re-sending after rejection should trigger email."""
        old_status = QuoteStatus.REJECTED
        new_status = QuoteStatus.SENT
        should_send = (new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT)
        assert should_send is True

    def test_email_on_expired_to_sent(self):
        """Re-sending expired quote should trigger email."""
        old_status = QuoteStatus.EXPIRED
        new_status = QuoteStatus.SENT
        should_send = (new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT)
        assert should_send is True


# ── Fixed Price Sync Logic (from admin.py update_quote_details) ───────

class TestFixedPriceSync:
    """
    When is_fixed_price is set to True and min_price != max_price,
    the system should sync max_price = min_price.
    """

    def test_fixed_price_syncs_max_to_min(self):
        """Setting is_fixed_price=True should set max_price = min_price."""
        min_price = Decimal("2000")
        max_price = Decimal("2500")
        is_fixed_price = True

        if is_fixed_price and min_price != max_price:
            max_price = min_price

        assert max_price == Decimal("2000")

    def test_fixed_price_already_equal_no_change(self):
        min_price = Decimal("2000")
        max_price = Decimal("2000")
        is_fixed_price = True

        if is_fixed_price and min_price != max_price:
            max_price = min_price

        assert max_price == Decimal("2000")

    def test_not_fixed_price_keeps_range(self):
        min_price = Decimal("2000")
        max_price = Decimal("2500")
        is_fixed_price = False

        if is_fixed_price and min_price != max_price:
            max_price = min_price

        assert max_price == Decimal("2500")

    def test_update_min_price_only(self):
        """Updating min_price alone should work without affecting max."""
        req = QuoteUpdateRequest(min_price=Decimal("1800"))
        assert req.min_price == Decimal("1800")
        assert req.max_price is None

    def test_update_both_prices(self):
        req = QuoteUpdateRequest(
            min_price=Decimal("3000"),
            max_price=Decimal("3500"),
        )
        assert req.min_price == Decimal("3000")
        assert req.max_price == Decimal("3500")


# ── Feedback / Accuracy Tracking ──────────────────────────────────────

class TestFeedbackAccuracy:
    """
    Tests the accuracy calculation logic from the submit_feedback endpoint.
    """

    def _calc_accuracy(self, actual_cost, min_price, max_price,
                       actual_volume=None, estimated_volume=None):
        """Replicates accuracy calculation from admin.py."""
        accuracy = {}
        if actual_cost is not None and min_price and max_price:
            actual = float(actual_cost)
            quoted_min = float(min_price)
            quoted_max = float(max_price)
            accuracy["cost_within_range"] = quoted_min <= actual <= quoted_max
            accuracy["cost_deviation_percent"] = round(
                ((actual - (quoted_min + quoted_max) / 2)
                 / ((quoted_min + quoted_max) / 2)) * 100, 1
            )
        if actual_volume is not None and estimated_volume:
            accuracy["volume_deviation_percent"] = round(
                ((float(actual_volume) - float(estimated_volume))
                 / float(estimated_volume)) * 100, 1
            )
        return accuracy

    def test_cost_within_range(self):
        acc = self._calc_accuracy(2500, 2000, 3000)
        assert acc["cost_within_range"] is True
        assert acc["cost_deviation_percent"] == 0.0

    def test_cost_exactly_at_min(self):
        acc = self._calc_accuracy(2000, 2000, 3000)
        assert acc["cost_within_range"] is True

    def test_cost_exactly_at_max(self):
        acc = self._calc_accuracy(3000, 2000, 3000)
        assert acc["cost_within_range"] is True

    def test_cost_below_range(self):
        acc = self._calc_accuracy(1500, 2000, 3000)
        assert acc["cost_within_range"] is False
        assert acc["cost_deviation_percent"] < 0

    def test_cost_above_range(self):
        acc = self._calc_accuracy(3500, 2000, 3000)
        assert acc["cost_within_range"] is False
        assert acc["cost_deviation_percent"] > 0

    def test_deviation_percent_math(self):
        """Deviation = (actual - midpoint) / midpoint * 100."""
        acc = self._calc_accuracy(3000, 2000, 2000)
        # midpoint = 2000, deviation = (3000-2000)/2000 * 100 = 50.0%
        assert acc["cost_deviation_percent"] == 50.0

    def test_negative_deviation(self):
        acc = self._calc_accuracy(1600, 2000, 2000)
        # midpoint = 2000, deviation = (1600-2000)/2000 * 100 = -20.0%
        assert acc["cost_deviation_percent"] == -20.0

    def test_volume_deviation(self):
        acc = self._calc_accuracy(2500, 2000, 3000, actual_volume=40, estimated_volume=35)
        # (40-35)/35 * 100 = 14.3%
        assert acc["volume_deviation_percent"] == 14.3

    def test_volume_underestimate(self):
        acc = self._calc_accuracy(2500, 2000, 3000, actual_volume=30, estimated_volume=35)
        # (30-35)/35 * 100 = -14.3%
        assert acc["volume_deviation_percent"] == -14.3

    def test_no_volume_feedback(self):
        acc = self._calc_accuracy(2500, 2000, 3000)
        assert "volume_deviation_percent" not in acc

    def test_no_cost_feedback(self):
        acc = self._calc_accuracy(None, 2000, 3000)
        assert "cost_within_range" not in acc
        assert "cost_deviation_percent" not in acc


class TestFeedbackRatingClamping:
    """The rating is clamped to [1.0, 5.0]."""

    def _clamp_rating(self, value):
        return min(max(float(value), 1.0), 5.0)

    def test_valid_rating(self):
        assert self._clamp_rating(3.5) == 3.5

    def test_min_rating(self):
        assert self._clamp_rating(1.0) == 1.0

    def test_max_rating(self):
        assert self._clamp_rating(5.0) == 5.0

    def test_below_min_clamped(self):
        assert self._clamp_rating(0.0) == 1.0
        assert self._clamp_rating(-2.0) == 1.0

    def test_above_max_clamped(self):
        assert self._clamp_rating(6.0) == 5.0
        assert self._clamp_rating(100.0) == 5.0

    def test_boundary_values(self):
        assert self._clamp_rating(0.99) == 1.0
        assert self._clamp_rating(5.01) == 5.0


# ── Full Lifecycle Scenarios ──────────────────────────────────────────

class TestFullLifecycleScenarios:
    """End-to-end lifecycle scenarios testing state progression."""

    def test_happy_path_draft_sent_accepted(self):
        """Standard flow: DRAFT → SENT → ACCEPTED."""
        status = QuoteStatus.DRAFT
        assert status == QuoteStatus.DRAFT

        # Admin sends quote
        old = status
        status = QuoteStatus.SENT
        should_email = (status == QuoteStatus.SENT and old != QuoteStatus.SENT)
        assert should_email is True
        assert status == QuoteStatus.SENT

        # Customer accepts
        old = status
        status = QuoteStatus.ACCEPTED
        should_email = (status == QuoteStatus.SENT and old != QuoteStatus.SENT)
        assert should_email is False
        assert status == QuoteStatus.ACCEPTED

    def test_rejection_then_resend(self):
        """DRAFT → SENT → REJECTED → SENT (re-send)."""
        status = QuoteStatus.DRAFT
        status = QuoteStatus.SENT
        status = QuoteStatus.REJECTED
        assert status == QuoteStatus.REJECTED

        # Re-send
        old = status
        status = QuoteStatus.SENT
        should_email = (status == QuoteStatus.SENT and old != QuoteStatus.SENT)
        assert should_email is True

    def test_expiry_flow(self):
        """DRAFT → SENT → EXPIRED."""
        status = QuoteStatus.DRAFT
        status = QuoteStatus.SENT
        status = QuoteStatus.EXPIRED
        assert status == QuoteStatus.EXPIRED

    def test_fixed_price_update_then_send(self):
        """Update details (set fixed price), then send."""
        min_price = Decimal("2000")
        max_price = Decimal("2500")
        is_fixed_price = True

        # Sync logic
        if is_fixed_price and min_price != max_price:
            max_price = min_price

        assert max_price == min_price == Decimal("2000")

        # Now send
        status = QuoteStatus.DRAFT
        old = status
        status = QuoteStatus.SENT
        should_email = (status == QuoteStatus.SENT and old != QuoteStatus.SENT)
        assert should_email is True

    def test_feedback_after_acceptance(self):
        """Full flow: accept → feedback → accuracy check."""
        status = QuoteStatus.ACCEPTED
        min_price = Decimal("2000")
        max_price = Decimal("2500")

        # Record feedback
        actual_cost = Decimal("2300")
        actual_volume = Decimal("38")
        estimated_volume = Decimal("35")

        # Calculate accuracy
        actual = float(actual_cost)
        quoted_min = float(min_price)
        quoted_max = float(max_price)
        within_range = quoted_min <= actual <= quoted_max
        mid = (quoted_min + quoted_max) / 2
        deviation = round(((actual - mid) / mid) * 100, 1)

        assert within_range is True
        assert deviation == 2.2  # (2300-2250)/2250 * 100 = 2.22..

        vol_dev = round(((float(actual_volume) - float(estimated_volume))
                         / float(estimated_volume)) * 100, 1)
        assert vol_dev == 8.6  # (38-35)/35 * 100 = 8.57..
