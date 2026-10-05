import pytest
from app.utils.text_cleaner import TextCleaner

@pytest.fixture
def cleaner():
    return TextCleaner()

def test_strips_html_tags(cleaner):
    text = "Hello <b>World</b>"
    cleaned = cleaner.clean(text)
    assert "<b>" not in cleaned
    assert "world" in cleaned

def test_extracts_upi_ids(cleaner):
    text = "Pay me at testuser@sbi or fake@icici"
    upi_ids = cleaner.extract_upi_ids(text)
    assert "testuser@sbi" in upi_ids
    assert "fake@icici" in upi_ids

def test_extracts_phone_numbers(cleaner):
    text = "Call me at +919876543210 or 09876543210"
    phones = cleaner.extract_phone_numbers(text)
    assert len(phones) > 0

def test_is_url_detection(cleaner):
    assert cleaner.is_url("http://example.com") is True
    assert cleaner.is_url("https://secure.bank.com/login") is True
    assert cleaner.is_url("Just some text") is False

def test_normalizes_whitespace(cleaner):
    text = "This   has \n\n too much   space"
    cleaned = cleaner.clean(text)
    assert cleaned == "this has too much space"
