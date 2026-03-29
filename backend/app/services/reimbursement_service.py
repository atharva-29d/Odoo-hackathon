from collections import defaultdict
from csv import writer
from datetime import datetime
from io import StringIO

from app.core.exceptions import ApiError
from app.core.firebase import get_firestore_client
from app.core.security import create_firebase_user, delete_firebase_user, sign_in_with_email_password
from app.services.currency_service import convert_currency, get_default_currency_by_country
from app.utils.constants import (
    DEFAULT_APPROVAL_THRESHOLD,
    DEFAULT_AUTO_APPROVE_AMOUNT,
    DEFAULT_HIGH_AMOUNT_REQUIRED_APPROVALS,
    DEFAULT_HIGH_AMOUNT_THRESHOLD,
    DEFAULT_WORKFLOW_STEPS,
    VALID_APPROVAL_ROLES,
)
from app.utils.serialization import clean_email, isoformat, parse_iso_date, utc_now


def _collection(name: str):
    return get_firestore_client().collection(name)


def _snapshot_to_dict(snapshot):
    if not snapshot or not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    data["id"] = snapshot.id
    return data


def _create_document(collection_name: str, data: dict, doc_id: str | None = None):
    collection = _collection(collection_name)
    ref = collection.document(doc_id) if doc_id else collection.document()
    ref.set(data)
    return _snapshot_to_dict(ref.get())


def _update_document(collection_name: str, doc_id: str, data: dict):
    ref = _collection(collection_name).document(doc_id)
    ref.update(data)
    return _snapshot_to_dict(ref.get())


def _delete_document(collection_name: str, doc_id: str):
    _collection(collection_name).document(doc_id).delete()


def _list_by_field(collection_name: str, field_name: str, value):
    return [_snapshot_to_dict(snapshot) for snapshot in _collection(collection_name).where(field_name, "==", value).stream()]


def _list_all(collection_name: str):
    return [_snapshot_to_dict(snapshot) for snapshot in _collection(collection_name).stream()]


def _sort_by_created_at(items: list[dict], reverse: bool = True):
    return sorted(items, key=lambda item: item.get("created_at") or datetime.min, reverse=reverse)


def _normalize_workflow_steps(steps: list[dict] | None):
    normalized = []
    for index, step in enumerate(steps or DEFAULT_WORKFLOW_STEPS, start=1):
        normalized.append(
            {
                "level_key": step.get("level_key", "").strip().lower(),
                "label": step.get("label", "").strip(),
                "approver_role": step.get("approver_role", step.get("level_key", "")).strip().lower(),
                "step_order": index,
            }
        )
    return normalized or DEFAULT_WORKFLOW_STEPS


def _log_audit_event(
    company_id: str,
    actor_id: str | None,
    action: str,
    entity_type: str,
    entity_id: str,
    message: str,
    metadata: dict | None = None,
):
    return _create_document(
        "audit_logs",
        {
            "company_id": company_id,
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "message": message,
            "metadata": metadata or {},
            "created_at": utc_now(),
        },
    )


def get_company_by_id(company_id: str):
    return _snapshot_to_dict(_collection("companies").document(company_id).get())


def get_user_by_id(user_id: str):
    return _snapshot_to_dict(_collection("users").document(user_id).get())


def get_expense_by_id(expense_id: str):
    return _snapshot_to_dict(_collection("expenses").document(expense_id).get())


def get_approval_by_id(approval_id: str):
    return _snapshot_to_dict(_collection("approvals").document(approval_id).get())


def find_user_by_email(email: str):
    query = _collection("users").where("email", "==", clean_email(email)).limit(1).stream()
    return next((_snapshot_to_dict(snapshot) for snapshot in query), None)


def list_company_users(company_id: str):
    return _sort_by_created_at([user for user in _list_by_field("users", "company_id", company_id) if user])


def list_company_expenses(company_id: str):
    return _sort_by_created_at([expense for expense in _list_by_field("expenses", "company_id", company_id) if expense])


def list_company_approvals(company_id: str):
    return _sort_by_created_at([approval for approval in _list_by_field("approvals", "company_id", company_id) if approval])


def list_company_audit_logs(company_id: str):
    return _sort_by_created_at([log for log in _list_by_field("audit_logs", "company_id", company_id) if log])


def list_expense_approvals(expense_id: str):
    approvals = [approval for approval in _list_by_field("approvals", "expense_id", expense_id) if approval]
    return sorted(approvals, key=lambda item: item.get("step_order") or 0)


def serialize_workflow_step(step: dict):
    return {
        "levelKey": step.get("level_key", ""),
        "label": step.get("label", ""),
        "approverRole": step.get("approver_role", ""),
        "stepOrder": step.get("step_order"),
    }


def serialize_company(company: dict | None):
    if not company:
        return None
    workflow_steps = company.get("workflow_steps") or DEFAULT_WORKFLOW_STEPS
    return {
        "_id": company["id"],
        "name": company.get("name", ""),
        "country": company.get("country", ""),
        "currency": company.get("currency", "USD"),
        "baseCurrency": company.get("currency", "USD"),
        "approvalRule": company.get("approval_rule", "hybrid"),
        "approvalThreshold": company.get("approval_threshold", DEFAULT_APPROVAL_THRESHOLD),
        "autoApproveAmount": company.get("auto_approve_amount", DEFAULT_AUTO_APPROVE_AMOUNT),
        "highAmountThreshold": company.get("high_amount_threshold", DEFAULT_HIGH_AMOUNT_THRESHOLD),
        "highAmountRequiredApprovals": company.get(
            "high_amount_required_approvals",
            DEFAULT_HIGH_AMOUNT_REQUIRED_APPROVALS,
        ),
        "workflowSteps": [serialize_workflow_step(step) for step in workflow_steps],
        "createdAt": isoformat(company.get("created_at")),
        "updatedAt": isoformat(company.get("updated_at")),
    }


def serialize_user_summary(user: dict | None):
    if not user:
        return None
    return {
        "_id": user["id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "employee"),
        "approvalRoles": user.get("approval_roles", []),
        "department": user.get("department", ""),
        "title": user.get("title", ""),
    }


def serialize_user(user: dict, manager: dict | None = None, company: dict | None = None, include_company: bool = False):
    payload = {
        "_id": user["id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "employee"),
        "approvalRoles": user.get("approval_roles", []),
        "manager": serialize_user_summary(manager) if manager else None,
        "title": user.get("title", ""),
        "department": user.get("department", ""),
        "isActive": user.get("is_active", True),
        "createdAt": isoformat(user.get("created_at")),
    }
    payload["company"] = serialize_company(company) if include_company else user.get("company_id")
    return payload


def serialize_ocr_meta(ocr_meta: dict | None):
    meta = ocr_meta or {}
    return {
        "text": meta.get("text", ""),
        "extractedAmount": meta.get("extracted_amount"),
        "extractedDate": meta.get("extracted_date", ""),
        "vendorName": meta.get("vendor_name", ""),
    }


def serialize_expense(expense: dict, employee: dict | None = None, approvals: list[dict] | None = None):
    return {
        "_id": expense["id"],
        "company": expense.get("company_id"),
        "employee": serialize_user_summary(employee) if employee else {"_id": expense.get("employee_id")},
        "submittedAmount": expense.get("submitted_amount", 0),
        "submittedCurrency": expense.get("submitted_currency", "USD"),
        "convertedAmount": expense.get("converted_amount", expense.get("submitted_amount", 0)),
        "companyCurrency": expense.get("company_currency", expense.get("submitted_currency", "USD")),
        "exchangeRate": expense.get("exchange_rate", 1),
        "conversionSource": expense.get("conversion_source", "same-currency"),
        "category": expense.get("category", ""),
        "description": expense.get("description", ""),
        "vendorName": expense.get("vendor_name", ""),
        "expenseDate": isoformat(expense.get("expense_date")),
        "receiptImagePath": expense.get("receipt_image_path", ""),
        "ocrMeta": serialize_ocr_meta(expense.get("ocr_meta")),
        "status": expense.get("status", "pending"),
        "currentStepOrder": expense.get("current_step_order"),
        "requiredApprovalCount": expense.get("required_approval_count", 0),
        "autoApproved": expense.get("auto_approved", False),
        "automationHint": expense.get("automation_hint", ""),
        "finalDecisionReason": expense.get("final_decision_reason", ""),
        "createdAt": isoformat(expense.get("created_at")),
        "updatedAt": isoformat(expense.get("updated_at")),
        "approvals": approvals or [],
    }


def serialize_approval(approval: dict, approver: dict | None = None, acted_by: dict | None = None, expense: dict | None = None):
    return {
        "_id": approval["id"],
        "company": approval.get("company_id"),
        "expense": expense or approval.get("expense_id"),
        "approver": serialize_user_summary(approver) if approver else {"_id": approval.get("approver_id")},
        "actedBy": serialize_user_summary(acted_by) if acted_by else None,
        "levelKey": approval.get("level_key", ""),
        "levelLabel": approval.get("level_label", ""),
        "stepOrder": approval.get("step_order", 0),
        "status": approval.get("status", "pending"),
        "isCurrent": approval.get("is_current", False),
        "comment": approval.get("comment", ""),
        "actedAt": isoformat(approval.get("acted_at")),
        "createdAt": isoformat(approval.get("created_at")),
        "updatedAt": isoformat(approval.get("updated_at")),
    }


def serialize_audit_log(log: dict, actor: dict | None = None):
    return {
        "_id": log["id"],
        "action": log.get("action", ""),
        "entityType": log.get("entity_type", ""),
        "entityId": log.get("entity_id", ""),
        "message": log.get("message", ""),
        "metadata": log.get("metadata", {}),
        "actor": serialize_user_summary(actor) if actor else None,
        "createdAt": isoformat(log.get("created_at")),
    }


def build_auth_payload(user: dict, company: dict, auth_session: dict):
    return {
        "token": auth_session.get("idToken"),
        "refreshToken": auth_session.get("refreshToken"),
        "expiresIn": int(auth_session.get("expiresIn", 3600)),
        "user": serialize_user(user, company=company, include_company=True),
        "company": serialize_company(company),
    }


def _build_session_for_credentials(email: str, password: str):
    auth_session = sign_in_with_email_password(email, password)
    user = get_user_by_id(auth_session.get("localId", ""))
    if not user:
        raise ApiError(404, "No workspace profile was found for this Firebase account")
    company = get_company_by_id(user["company_id"])
    if not company:
        raise ApiError(404, "Associated company was not found")
    return build_auth_payload(user, company, auth_session)


def create_company_and_admin(payload: dict):
    if find_user_by_email(payload["email"]):
        raise ApiError(409, "A user with this email already exists")

    timestamp = utc_now()
    company = None
    firebase_user = None

    try:
        company = _create_document(
            "companies",
            {
                "name": payload["company_name"].strip(),
                "country": payload["country"].strip(),
                "currency": get_default_currency_by_country(payload["country"]),
                "approval_rule": payload.get("approval_rule", "hybrid"),
                "approval_threshold": DEFAULT_APPROVAL_THRESHOLD,
                "auto_approve_amount": DEFAULT_AUTO_APPROVE_AMOUNT,
                "high_amount_threshold": DEFAULT_HIGH_AMOUNT_THRESHOLD,
                "high_amount_required_approvals": DEFAULT_HIGH_AMOUNT_REQUIRED_APPROVALS,
                "workflow_steps": _normalize_workflow_steps(DEFAULT_WORKFLOW_STEPS),
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )

        firebase_user = create_firebase_user(payload["email"], payload["password"], payload["admin_name"].strip())
        user = _create_document(
            "users",
            {
                "company_id": company["id"],
                "name": payload["admin_name"].strip(),
                "email": clean_email(payload["email"]),
                "role": "admin",
                "approval_roles": ["finance", "director", "cfo"],
                "manager_id": None,
                "title": "Company Admin",
                "department": "Finance",
                "is_active": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            doc_id=firebase_user.uid,
        )
    except Exception as exc:  # noqa: BLE001
        if firebase_user:
            delete_firebase_user(firebase_user.uid)
        if company:
            _delete_document("companies", company["id"])
        if isinstance(exc, ApiError):
            raise
        raise ApiError(500, "Unable to create the company workspace") from exc

    _log_audit_event(company["id"], user["id"], "company.created", "company", company["id"], "Company workspace created")
    _log_audit_event(company["id"], user["id"], "user.created", "user", user["id"], "Admin account created")
    return _build_session_for_credentials(payload["email"], payload["password"])


def login_user(payload: dict):
    return _build_session_for_credentials(payload["email"], payload["password"])


def create_user_record(current_user: dict, payload: dict):
    if current_user.get("role") != "admin":
        raise ApiError(403, "Only admins can create users")

    if find_user_by_email(payload["email"]):
        raise ApiError(409, "This email is already registered")

    manager = None
    manager_id = payload.get("manager_id")
    if manager_id:
        manager = get_user_by_id(manager_id)
        if not manager or manager.get("company_id") != current_user["company_id"]:
            raise ApiError(404, "Selected manager was not found")

    approval_roles = [role for role in payload.get("approval_roles", []) if role in VALID_APPROVAL_ROLES]
    if payload["role"] == "manager" and "manager" not in approval_roles:
        approval_roles.append("manager")
    if payload["role"] == "admin" and not approval_roles:
        approval_roles.extend(["finance", "director"])

    timestamp = utc_now()
    firebase_user = None

    try:
        firebase_user = create_firebase_user(payload["email"], payload["password"], payload["name"].strip())
        user = _create_document(
            "users",
            {
                "company_id": current_user["company_id"],
                "name": payload["name"].strip(),
                "email": clean_email(payload["email"]),
                "role": payload["role"],
                "approval_roles": approval_roles,
                "manager_id": manager_id or None,
                "title": payload.get("title", "").strip(),
                "department": payload.get("department", "").strip(),
                "is_active": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            doc_id=firebase_user.uid,
        )
    except Exception as exc:  # noqa: BLE001
        if firebase_user:
            delete_firebase_user(firebase_user.uid)
        if isinstance(exc, ApiError):
            raise
        raise ApiError(500, "Unable to create the workspace user") from exc

    _log_audit_event(
        current_user["company_id"],
        current_user["id"],
        "user.created",
        "user",
        user["id"],
        f"Created {payload['role']} user {payload['name'].strip()}",
        metadata={"role": payload["role"]},
    )
    return serialize_user(user, manager=manager)


def list_users_for_actor(current_user: dict):
    users = list_company_users(current_user["company_id"])
    user_map = {user["id"]: user for user in users}
    return [serialize_user(user, manager=user_map.get(user.get("manager_id"))) for user in users]


def get_company_settings_for_actor(current_user: dict):
    return serialize_company(current_user["company"])


def update_company_settings(current_user: dict, payload: dict):
    if current_user.get("role") != "admin":
        raise ApiError(403, "Only admins can update company settings")

    workflow_steps = _normalize_workflow_steps(payload.get("workflow_steps"))
    updated_company = _update_document(
        "companies",
        current_user["company_id"],
        {
            "approval_rule": payload["approval_rule"],
            "approval_threshold": payload["approval_threshold"],
            "auto_approve_amount": payload["auto_approve_amount"],
            "high_amount_threshold": payload["high_amount_threshold"],
            "high_amount_required_approvals": payload["high_amount_required_approvals"],
            "workflow_steps": workflow_steps,
            "updated_at": utc_now(),
        },
    )
    _log_audit_event(
        current_user["company_id"],
        current_user["id"],
        "company.settings_updated",
        "company",
        current_user["company_id"],
        "Updated company approval settings",
    )
    return serialize_company(updated_company)


def _resolve_step_approver(step: dict, employee: dict, users: list[dict]):
    approver_role = step.get("approver_role", step.get("level_key", "")).lower()

    if approver_role == "manager":
        direct_manager = next(
            (
                user
                for user in users
                if user["id"] == employee.get("manager_id") and user.get("is_active", True)
            ),
            None,
        )
        if direct_manager:
            return direct_manager

        return next(
            (
                user
                for user in users
                if user["id"] != employee["id"] and user.get("is_active", True) and user.get("role") in {"manager", "admin"}
            ),
            None,
        )

    return next(
        (
            user
            for user in users
            if user["id"] != employee["id"]
            and user.get("is_active", True)
            and (
                approver_role in user.get("approval_roles", [])
                or user.get("role") == approver_role
                or (approver_role == "admin" and user.get("role") == "admin")
            )
        ),
        next((user for user in users if user.get("role") == "admin" and user["id"] != employee["id"]), None),
    )


def resolve_workflow_approvers(employee: dict, company: dict, users: list[dict]):
    workflow_steps = company.get("workflow_steps") or DEFAULT_WORKFLOW_STEPS
    steps = []

    for index, step in enumerate(workflow_steps, start=1):
        approver = _resolve_step_approver(step, employee, users)
        if approver:
            steps.append(
                {
                    "level_key": step.get("level_key", ""),
                    "label": step.get("label", ""),
                    "step_order": index,
                    "approver_id": approver["id"],
                }
            )

    if not steps:
        raise ApiError(400, "No approvers could be resolved for this expense")

    return steps


def _group_company_data(company_id: str):
    users = list_company_users(company_id)
    approvals = list_company_approvals(company_id)
    expenses = list_company_expenses(company_id)
    return users, approvals, expenses


def _build_user_index(users: list[dict]):
    return {user["id"]: user for user in users}


def _serialize_expense_list(expenses: list[dict], users: list[dict], approvals: list[dict]):
    user_index = _build_user_index(users)
    approval_groups = defaultdict(list)
    for approval in approvals:
        approver = user_index.get(approval.get("approver_id"))
        acted_by = user_index.get(approval.get("acted_by_id"))
        approval_groups[approval["expense_id"]].append(serialize_approval(approval, approver=approver, acted_by=acted_by))

    for expense_id in approval_groups:
        approval_groups[expense_id].sort(key=lambda item: item.get("stepOrder", 0))

    return [
        serialize_expense(
            expense,
            employee=user_index.get(expense.get("employee_id")),
            approvals=approval_groups.get(expense["id"], []),
        )
        for expense in expenses
    ]


def get_expense_detail(expense_id: str):
    expense = get_expense_by_id(expense_id)
    if not expense:
        raise ApiError(404, "Expense not found")

    users, approvals, _ = _group_company_data(expense["company_id"])
    user_index = _build_user_index(users)
    related_approvals = [approval for approval in approvals if approval.get("expense_id") == expense_id]
    serialized_approvals = [
        serialize_approval(
            approval,
            approver=user_index.get(approval.get("approver_id")),
            acted_by=user_index.get(approval.get("acted_by_id")),
        )
        for approval in sorted(related_approvals, key=lambda item: item.get("step_order", 0))
    ]
    return serialize_expense(expense, employee=user_index.get(expense.get("employee_id")), approvals=serialized_approvals)


def create_expense_record(current_user: dict, payload: dict):
    company = current_user["company"]
    try:
        expense_date = parse_iso_date(payload["expense_date"])
    except ValueError as exc:
        raise ApiError(422, str(exc), errors={"expenseDate": str(exc)}) from exc

    conversion = convert_currency(payload["amount"], payload["currency"], company.get("currency", "USD"))
    converted_amount = conversion["converted_amount"]
    auto_limit = float(company.get("auto_approve_amount", DEFAULT_AUTO_APPROVE_AMOUNT))
    high_amount_threshold = float(company.get("high_amount_threshold", DEFAULT_HIGH_AMOUNT_THRESHOLD))
    high_amount_required_approvals = int(
        company.get("high_amount_required_approvals", DEFAULT_HIGH_AMOUNT_REQUIRED_APPROVALS)
    )

    timestamp = utc_now()
    auto_approved = converted_amount < auto_limit
    automation_hint = "Auto Approve" if converted_amount < auto_limit else ""

    expense = _create_document(
        "expenses",
        {
            "company_id": current_user["company_id"],
            "employee_id": current_user["id"],
            "submitted_amount": round(payload["amount"], 2),
            "submitted_currency": payload["currency"].strip().upper(),
            "converted_amount": converted_amount,
            "company_currency": company.get("currency", "USD"),
            "exchange_rate": conversion["rate"],
            "conversion_source": conversion["source"],
            "category": payload["category"].strip(),
            "description": payload["description"].strip(),
            "vendor_name": payload.get("vendor_name", "").strip(),
            "expense_date": expense_date,
            "receipt_image_path": payload.get("receipt_image_path", ""),
            "ocr_meta": {
                "text": (payload.get("ocr_meta") or {}).get("text", ""),
                "extracted_amount": (payload.get("ocr_meta") or {}).get("extracted_amount"),
                "extracted_date": (payload.get("ocr_meta") or {}).get("extracted_date", ""),
                "vendor_name": (payload.get("ocr_meta") or {}).get("vendor_name", ""),
            },
            "status": "approved" if auto_approved else "pending",
            "current_step_order": None if auto_approved else 1,
            "required_approval_count": 0,
            "auto_approved": auto_approved,
            "automation_hint": automation_hint,
            "final_decision_reason": (
                f"Auto-approved because the converted amount is below {company.get('currency', 'USD')} {auto_limit:.2f}"
                if auto_approved
                else ""
            ),
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )

    if auto_approved:
        _log_audit_event(
            current_user["company_id"],
            current_user["id"],
            "expense.auto_approved",
            "expense",
            expense["id"],
            "Expense auto-approved below the company threshold",
            metadata={"convertedAmount": converted_amount},
        )
        return get_expense_detail(expense["id"])

    users = list_company_users(current_user["company_id"])
    steps = resolve_workflow_approvers(current_user, company, users)
    required_approval_count = (
        min(high_amount_required_approvals, len(steps)) if converted_amount > high_amount_threshold else 0
    )

    batch = get_firestore_client().batch()
    for index, step in enumerate(steps):
        ref = _collection("approvals").document()
        batch.set(
            ref,
            {
                "company_id": current_user["company_id"],
                "expense_id": expense["id"],
                "approver_id": step["approver_id"],
                "acted_by_id": None,
                "level_key": step["level_key"],
                "level_label": step["label"],
                "step_order": step["step_order"],
                "status": "pending",
                "is_current": index == 0,
                "comment": "",
                "acted_at": None,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        )

    expense_ref = _collection("expenses").document(expense["id"])
    batch.update(
        expense_ref,
        {
            "required_approval_count": required_approval_count,
            "updated_at": timestamp,
        },
    )
    batch.commit()

    _log_audit_event(
        current_user["company_id"],
        current_user["id"],
        "expense.submitted",
        "expense",
        expense["id"],
        "Expense submitted for approval",
        metadata={"requiredApprovalCount": required_approval_count},
    )
    return get_expense_detail(expense["id"])


def list_my_expenses(current_user: dict):
    users, approvals, expenses = _group_company_data(current_user["company_id"])
    filtered = [expense for expense in expenses if expense.get("employee_id") == current_user["id"]]
    return _serialize_expense_list(filtered, users, approvals)


def list_company_expenses_for_actor(current_user: dict):
    if current_user.get("role") not in {"admin", "manager"}:
        raise ApiError(403, "Only admins and managers can view this list")

    users, approvals, expenses = _group_company_data(current_user["company_id"])

    if current_user.get("role") == "manager":
        team_ids = {current_user["id"]}
        for user in users:
            if user.get("manager_id") == current_user["id"]:
                team_ids.add(user["id"])
        expenses = [expense for expense in expenses if expense.get("employee_id") in team_ids]

    return _serialize_expense_list(expenses, users, approvals)


def list_pending_approvals(current_user: dict):
    if current_user.get("role") not in {"admin", "manager"}:
        raise ApiError(403, "You do not have access to the approval queue")

    users, approvals, expenses = _group_company_data(current_user["company_id"])
    user_index = _build_user_index(users)
    expense_index = {expense["id"]: expense for expense in expenses}

    pending = [approval for approval in approvals if approval.get("status") == "pending" and approval.get("is_current")]
    if current_user.get("role") != "admin":
        pending = [approval for approval in pending if approval.get("approver_id") == current_user["id"]]

    pending = sorted(pending, key=lambda item: item.get("created_at") or datetime.min)

    return [
        serialize_approval(
            approval,
            approver=user_index.get(approval.get("approver_id")),
            acted_by=user_index.get(approval.get("acted_by_id")),
            expense=(
                serialize_expense(
                    expense_index[approval["expense_id"]],
                    employee=user_index.get(expense_index[approval["expense_id"]].get("employee_id")),
                )
                if approval.get("expense_id") in expense_index
                else None
            ),
        )
        for approval in pending
    ]


def get_pending_expense_queue(current_user: dict):
    return list_pending_approvals(current_user)


def build_expense_report(current_user: dict, scope: str | None = None):
    selected_scope = (scope or "").strip().lower()
    if not selected_scope:
        selected_scope = "company" if current_user.get("role") in {"admin", "manager"} else "my"

    if selected_scope == "my":
        expenses = list_my_expenses(current_user)
    elif selected_scope == "company":
        expenses = list_company_expenses_for_actor(current_user)
    else:
        raise ApiError(400, "Invalid report scope")

    output = StringIO()
    csv_writer = writer(output)
    csv_writer.writerow(
        [
            "Expense ID",
            "Employee",
            "Department",
            "Category",
            "Submitted Amount",
            "Submitted Currency",
            "Converted Amount",
            "Company Currency",
            "Status",
            "Expense Date",
            "Vendor",
            "Approval Steps",
            "Final Decision",
            "Created At",
        ]
    )

    for expense in expenses:
        csv_writer.writerow(
            [
                expense.get("_id", ""),
                expense.get("employee", {}).get("name", ""),
                expense.get("employee", {}).get("department", ""),
                expense.get("category", ""),
                expense.get("submittedAmount", 0),
                expense.get("submittedCurrency", ""),
                expense.get("convertedAmount", 0),
                expense.get("companyCurrency", ""),
                expense.get("status", ""),
                expense.get("expenseDate", ""),
                expense.get("vendorName", ""),
                " | ".join(
                    f"{approval.get('levelLabel', '')}:{approval.get('status', '')}" for approval in expense.get("approvals", [])
                ),
                expense.get("finalDecisionReason", ""),
                expense.get("createdAt", ""),
            ]
        )

    filename = f"expense-report-{selected_scope}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
    return {"filename": filename, "content": output.getvalue()}


def _cfo_approved(approvals: list[dict], users: list[dict]):
    user_index = _build_user_index(users)
    for approval in approvals:
        if approval.get("status") != "approved":
            continue
        approver = user_index.get(approval.get("approver_id"))
        if approver and "cfo" in approver.get("approval_roles", []):
            return True
    return False


def should_finalize_approval(expense: dict, company: dict, approvals: list[dict], users: list[dict]):
    approved_count = len([approval for approval in approvals if approval.get("status") == "approved"])
    total_count = len(approvals) or 1
    approval_ratio = approved_count / total_count
    cfo_approved = _cfo_approved(approvals, users)
    required_approval_count = int(expense.get("required_approval_count") or 0)
    approval_rule = company.get("approval_rule", "hybrid")
    threshold = float(company.get("approval_threshold", DEFAULT_APPROVAL_THRESHOLD))

    if cfo_approved and approval_rule in {"specific", "hybrid"}:
        return True, "Approved because CFO approval was received"

    if required_approval_count:
        if approved_count >= required_approval_count:
            return True, f"Approved after {required_approval_count} required approvals"
        return False, None

    if approved_count == total_count:
        return True, "Approved after all workflow steps completed"

    if approval_rule in {"percentage", "hybrid"} and approval_ratio >= threshold:
        return True, f"Approved after reaching {int(threshold * 100)}% of approvals"

    return False, None


def finalize_expense_status(expense_id: str, status: str, reason: str, actor_id: str | None = None):
    expense = get_expense_by_id(expense_id)
    if not expense:
        raise ApiError(404, "Expense not found")

    approvals = list_expense_approvals(expense_id)
    timestamp = utc_now()
    batch = get_firestore_client().batch()
    for approval in approvals:
        if approval.get("status") == "pending":
            ref = _collection("approvals").document(approval["id"])
            batch.update(
                ref,
                {
                    "status": "skipped",
                    "is_current": False,
                    "updated_at": timestamp,
                },
            )

    expense_ref = _collection("expenses").document(expense_id)
    batch.update(
        expense_ref,
        {
            "status": status,
            "current_step_order": None,
            "final_decision_reason": reason,
            "updated_at": timestamp,
        },
    )
    batch.commit()

    _log_audit_event(
        expense["company_id"],
        actor_id,
        f"expense.{status}",
        "expense",
        expense_id,
        reason,
    )
    return get_expense_detail(expense_id)


def process_approval_action(current_user: dict, approval_id: str, action: str, comment: str = ""):
    if current_user.get("role") not in {"admin", "manager"}:
        raise ApiError(403, "You do not have access to approvals")

    approval = get_approval_by_id(approval_id)
    if not approval:
        raise ApiError(404, "Approval not found")

    if approval.get("company_id") != current_user["company_id"]:
        raise ApiError(403, "You are not allowed to access this approval")

    if approval.get("status") != "pending" or not approval.get("is_current"):
        raise ApiError(400, "This approval step is no longer active")

    can_override = current_user.get("role") == "admin"
    is_assigned_approver = approval.get("approver_id") == current_user["id"]
    if not can_override and not is_assigned_approver:
        raise ApiError(403, "You are not allowed to action this approval")

    timestamp = utc_now()
    new_status = "approved" if action == "approve" else "rejected"
    _update_document(
        "approvals",
        approval_id,
        {
            "status": new_status,
            "comment": comment,
            "is_current": False,
            "acted_at": timestamp,
            "acted_by_id": current_user["id"],
            "updated_at": timestamp,
        },
    )

    _log_audit_event(
        current_user["company_id"],
        current_user["id"],
        f"approval.{new_status}",
        "approval",
        approval_id,
        f"{approval.get('level_label', 'Approval step')} {new_status}",
        metadata={"expenseId": approval["expense_id"], "comment": comment},
    )

    if action == "reject":
        expense = finalize_expense_status(
            approval["expense_id"],
            "rejected",
            comment or "Rejected during approval",
            actor_id=current_user["id"],
        )
        return {"expense": expense}

    expense = get_expense_by_id(approval["expense_id"])
    approvals = list_expense_approvals(approval["expense_id"])
    users = list_company_users(current_user["company_id"])

    should_finalize, reason = should_finalize_approval(expense, current_user["company"], approvals, users)
    if should_finalize:
        expense = finalize_expense_status(approval["expense_id"], "approved", reason or "Approved", actor_id=current_user["id"])
        return {"expense": expense}

    next_pending = next((item for item in approvals if item.get("status") == "pending"), None)
    if next_pending:
        _update_document(
            "approvals",
            next_pending["id"],
            {
                "is_current": True,
                "updated_at": timestamp,
            },
        )
        _update_document(
            "expenses",
            approval["expense_id"],
            {
                "status": "in_review",
                "current_step_order": next_pending.get("step_order"),
                "final_decision_reason": "",
                "updated_at": timestamp,
            },
        )
        _log_audit_event(
            current_user["company_id"],
            current_user["id"],
            "expense.routed",
            "expense",
            approval["expense_id"],
            f"Expense moved to {next_pending.get('level_label', 'next')} approval step",
            metadata={"nextApprovalId": next_pending["id"]},
        )

    return {"expense": get_expense_detail(approval["expense_id"])}


def process_expense_action(current_user: dict, expense_id: str, action: str, comment: str = ""):
    expense = get_expense_by_id(expense_id)
    if not expense or expense.get("company_id") != current_user["company_id"]:
        raise ApiError(404, "Expense not found")

    approvals = list_expense_approvals(expense_id)
    active_approval = next((approval for approval in approvals if approval.get("status") == "pending" and approval.get("is_current")), None)
    if not active_approval:
        raise ApiError(400, "There is no active approval step for this expense")

    return process_approval_action(current_user, active_approval["id"], action, comment)


def list_audit_logs_for_actor(current_user: dict):
    logs = list_company_audit_logs(current_user["company_id"])[:40]
    users = list_company_users(current_user["company_id"])
    user_index = _build_user_index(users)
    return [serialize_audit_log(log, actor=user_index.get(log.get("actor_id"))) for log in logs]


def clear_collection(collection_name: str):
    for document in _list_all(collection_name):
        _collection(collection_name).document(document["id"]).delete()
