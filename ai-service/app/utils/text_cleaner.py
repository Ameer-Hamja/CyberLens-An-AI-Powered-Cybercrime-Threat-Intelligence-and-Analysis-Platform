import re
from typing import List


class TextCleaner:
    def __init__(self):
        self._last_urls: List[str] = []
        self.url_pattern = re.compile(r"https?://\S+")
        self.upi_pattern = re.compile(r"[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}")
        self.phone_pattern = re.compile(r"(?:\+91|0)?[6-9]\d{9}")

    def clean(self, text: str, max_text_length: int = 512) -> str:
        if not text:
            return ""
        # 1. Decode unicode escapes
        import html
        import unicodedata

        text = unicodedata.normalize("NFKC", html.unescape(text))
        # 2. Remove HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        # 3. Remove URLs and store them
        self._last_urls = self.extract_urls(text)
        text = self.url_pattern.sub(" ", text)
        # 4. Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()
        # 5. Lowercase for classification
        text = text.lower()
        # 6. Truncate approx
        max_chars = 5000
        if len(text) > max_chars:
            text = text[:max_chars]
        return text

    def extract_urls(self, text: str) -> List[str]:
        if not text:
            return []
        urls = self.url_pattern.findall(text)
        return [url for url in urls if len(url) > 7]

    def extract_upi_ids(self, text: str) -> List[str]:
        if not text:
            return []
        return list(set(self.upi_pattern.findall(text)))

    def extract_phone_numbers(self, text: str) -> List[str]:
        if not text:
            return []
        return list(set(self.phone_pattern.findall(text)))

    def is_url(self, text: str) -> bool:
        if not text:
            return False
        from urllib.parse import urlsplit

        value = text.strip()
        if any(char.isspace() for char in value):
            return False
        try:
            parsed = urlsplit(value if "://" in value else "https://" + value)
            return (
                parsed.scheme in {"http", "https"}
                and bool(parsed.hostname)
                and "." in parsed.hostname
                and "@" not in value
            )
        except ValueError:
            return False

    def is_upi_id(self, text: str) -> bool:
        if not text:
            return False
        return bool(re.fullmatch(self.upi_pattern, text.strip()))
