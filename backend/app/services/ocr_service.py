import re
import uuid
from pathlib import Path

import pytesseract
from fastapi import UploadFile
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import ApiError


def _parse_amount(text: str) -> float | None:
    matches = re.findall(r"(?:\d{1,3}(?:[, ]\d{3})*|\d+)(?:\.\d{2})", text)
    values = []
    for match in matches:
        try:
            values.append(float(match.replace(",", "").replace(" ", "").strip()))
        except ValueError:
            continue

    if not values:
        return None

    return max(values)


def _parse_date(text: str) -> str:
    match = re.search(
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b",
        text,
    )
    return match.group(1) if match else ""


def _parse_vendor(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if len(line) > 2 and re.search(r"[A-Za-z]", line) and not re.search(r"receipt|invoice|total|amount|gst|tax", line, re.I):
            return line
    return ""


async def save_receipt_file(receipt: UploadFile) -> str:
    if not receipt.filename:
        raise ApiError(400, "Please upload a receipt image")

    if not receipt.content_type or not receipt.content_type.startswith("image/"):
        raise ApiError(400, "Only image uploads are supported")

    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(receipt.filename).suffix or ".png"
    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = upload_dir / filename
    content = await receipt.read()
    destination.write_bytes(content)
    return str(destination)


def extract_receipt_data(file_path: str) -> dict:
    settings = get_settings()
    if settings.tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

    try:
        text = pytesseract.image_to_string(Image.open(file_path), lang=settings.tesseract_lang)
    except pytesseract.TesseractNotFoundError as exc:
        raise ApiError(
            500,
            "Tesseract OCR is not installed. Install Tesseract locally and optionally set TESSERACT_CMD in backend/.env.",
        ) from exc
    except Exception as exc:
        raise ApiError(500, f"Unable to process receipt image: {exc}") from exc

    return {
        "text": text,
        "extractedAmount": _parse_amount(text),
        "extractedDate": _parse_date(text),
        "vendorName": _parse_vendor(text),
    }
