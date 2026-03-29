from app.core.exceptions import ApiError
from app.utils.constants import COUNTRY_CURRENCY_MAP, FALLBACK_RATES


def get_default_currency_by_country(country: str) -> str:
    normalized = country.strip().lower().replace(".", "")
    normalized = " ".join(normalized.split())
    compact = normalized.replace(" ", "")
    return COUNTRY_CURRENCY_MAP.get(normalized) or COUNTRY_CURRENCY_MAP.get(compact) or "USD"


def convert_currency(amount: float, from_currency: str, to_currency: str) -> dict:
    source = from_currency.strip().upper()
    target = to_currency.strip().upper()

    if amount <= 0:
        raise ApiError(400, "Amount must be greater than zero")

    if source == target:
        return {
            "converted_amount": round(amount, 2),
            "rate": 1.0,
            "source": "same-currency",
        }

    source_rate = FALLBACK_RATES.get(source)
    target_rate = FALLBACK_RATES.get(target)

    if source_rate is None or target_rate is None:
        raise ApiError(400, f"Conversion is not available for {source} to {target}")

    usd_amount = amount / source_rate
    converted = usd_amount * target_rate
    rate = converted / amount

    return {
        "converted_amount": round(converted, 2),
        "rate": round(rate, 6),
        "source": "offline-fallback",
    }
