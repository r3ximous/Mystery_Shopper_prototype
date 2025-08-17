"""Security & sanitization utilities (prototype).

Provides:
- HTML / script stripping via bleach
- Basic allow-list validators for identifiers
- Simple API key dependency for admin endpoints
"""
from typing import Optional
import re
import bleach
from fastapi import Header, HTTPException, status, Depends

ALLOWED_TAGS: list[str] = []  # no HTML allowed in text fields

_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,50}$")
_CHANNEL_PATTERN = re.compile(r"^[A-Z_]{2,30}$")

def sanitize_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = bleach.clean(value, tags=ALLOWED_TAGS, strip=True)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:500]

def validate_identifier(value: str, field: str) -> str:
    # Replace any whitespace sequences with underscore prior to validation
    if value is None:
        raise ValueError(f"Missing {field}")
    value = re.sub(r"\s+", "_", value)
    if not _ID_PATTERN.match(value):
        raise ValueError(f"Invalid {field} format")
    return value

def validate_channel(value: str) -> str:
    if not _CHANNEL_PATTERN.match(value.upper()):
        raise ValueError("Invalid channel")
    return value.upper()

API_KEY_HEADER = "X-API-Key"
_ADMIN_KEYS = {"dev-admin-key"}  # In production load from vault / env

def api_key_auth(x_api_key: str = Header(None)):
    if x_api_key not in _ADMIN_KEYS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key")
    return True

def get_admin_auth(dep: bool = Depends(api_key_auth)):
    return dep
