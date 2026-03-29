import json
from urllib import error, parse, request

from app.core.config import get_settings
from app.core.exceptions import ApiError
from app.utils.constants import COUNTRY_CURRENCY_MAP, FALLBACK_RATES


def get_default_currency_by_country(country: str) -> str:
    normalized = country.strip().lower().replace(".", "")
    normalized = " ".join(normalized.split())
    compact = normalized.replace(" ", "")

    api_currency = _fetch_country_currency(country)
    if api_currency:
        return api_currency

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

    live_conversion = _fetch_exchange_rate(amount, source, target)
    if live_conversion:
        return live_conversion

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


def _fetch_country_currency(country: str) -> str | None:
    settings = get_settings()
    encoded_country = parse.quote(country.strip())
    url = f"{settings.rest_countries_api_url}/name/{encoded_country}?fullText=true&fields=currencies,name"

    try:
        with request.urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    if not payload:
        return None

    currencies = (payload[0] or {}).get("currencies") or {}
    if not currencies:
        return None
    return next(iter(currencies.keys()), None)


def _fetch_exchange_rate(amount: float, source: str, target: str) -> dict | None:
    settings = get_settings()
    query = parse.urlencode(
        {
            "amount": round(amount, 2),
            "from": source,
            "to": target,
        }
    )
    url = f"{settings.exchange_rate_api_url}/latest?{query}"

    try:
        with request.urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (error.HTTPError, error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    rates = payload.get("rates") or {}
    converted_amount = rates.get(target)
    if converted_amount in {None, ""}:
        return None

    return {
        "converted_amount": round(float(converted_amount), 2),
        "rate": round(float(converted_amount) / amount, 6),
        "source": "frankfurter-live",
    }
