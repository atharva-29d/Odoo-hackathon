from datetime import date, datetime
from typing import Any


def utc_now() -> datetime:
    return datetime.utcnow()


def isoformat(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(microsecond=0).isoformat() + "Z"
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def parse_iso_date(value: str) -> datetime:
    try:
        if len(value) == 10:
            return datetime.fromisoformat(value)
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Please enter a valid date") from exc


def clean_email(value: str) -> str:
    return value.strip().lower()
