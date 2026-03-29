COUNTRY_CURRENCY_MAP = {
    "india": "INR",
    "united states": "USD",
    "usa": "USD",
    "canada": "CAD",
    "united kingdom": "GBP",
    "uk": "GBP",
    "germany": "EUR",
    "france": "EUR",
    "spain": "EUR",
    "italy": "EUR",
    "netherlands": "EUR",
    "uae": "AED",
    "united arab emirates": "AED",
    "singapore": "SGD",
    "australia": "AUD",
    "japan": "JPY",
    "saudi arabia": "SAR",
    "mexico": "MXN",
    "brazil": "BRL",
    "south africa": "ZAR",
}

FALLBACK_RATES = {
    "USD": 1.0,
    "INR": 83.1,
    "EUR": 0.92,
    "GBP": 0.79,
    "AED": 3.67,
    "SGD": 1.35,
    "AUD": 1.53,
    "JPY": 151.2,
    "CAD": 1.36,
    "SAR": 3.75,
    "MXN": 16.8,
    "BRL": 5.03,
    "ZAR": 18.35,
}

DEFAULT_WORKFLOW = [
    {"level_key": "manager", "label": "Manager"},
    {"level_key": "finance", "label": "Finance"},
    {"level_key": "director", "label": "Director"},
]
