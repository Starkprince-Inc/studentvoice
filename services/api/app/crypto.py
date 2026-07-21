from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException

from .config import get_settings


def encrypt_contact(value: str | None) -> str | None:
    if not value:
        return None
    key = get_settings().source_contact_key
    if not key:
        raise HTTPException(status_code=503, detail="Protected contact storage is not configured")
    return Fernet(key.encode()).encrypt(value.encode()).decode()


def decrypt_contact(value: str | None) -> str | None:
    if not value:
        return None
    key = get_settings().source_contact_key
    if not key:
        return None
    try:
        return Fernet(key.encode()).decrypt(value.encode()).decode()
    except InvalidToken:
        return None
