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

VALID_APP_ROLES = {"admin", "manager", "employee"}
VALID_APPROVAL_ROLES = {"manager", "finance", "director", "cfo", "admin"}
VALID_APPROVAL_RULES = {"percentage", "specific", "hybrid"}

DEFAULT_APPROVAL_THRESHOLD = 0.6
DEFAULT_AUTO_APPROVE_AMOUNT = 1000
DEFAULT_HIGH_AMOUNT_THRESHOLD = 5000
DEFAULT_HIGH_AMOUNT_REQUIRED_APPROVALS = 3

DEFAULT_WORKFLOW_STEPS = [
    {"level_key": "manager", "label": "Manager", "approver_role": "manager"},
    {"level_key": "finance", "label": "Finance", "approver_role": "finance"},
    {"level_key": "director", "label": "Director", "approver_role": "director"},
]
