from collections import defaultdict
from datetime import datetime

from app.core.exceptions import ApiError
from app.core.firebase import get_firestore_client
from app.core.security import create_access_token, hash_password, verify_password
from app.services.currency_service import convert_currency, get_default_currency_by_country
from app.utils.constants import DEFAULT_WORKFLOW
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


def _list_by_field(collection_name: str, field_name: str, value):
    return [_snapshot_to_dict(snapshot) for snapshot in _collection(collection_name).where(field_name, "==", value).stream()]


def _list_all(collection_name: str):
    return [_snapshot_to_dict(snapshot) for snapshot in _collection(collection_name).stream()]


def _sort_by_created_at(items: list[dict], reverse: bool = True):
    return sorted(items, key=lambda item: item.get("created_at") or datetime.min, reverse=reverse)


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


def list_expense_approvals(expense_id: str):
    approvals = [approval for approval in _list_by_field("approvals", "expense_id", expense_id) if approval]
    return sorted(approvals, key=lambda item: item.get("step_order") or 0)


def serialize_company(company: dict | None):
    if not company:
        return None
    return {
        "_id": company["id"],
        "name": company.get("name", ""),
        "country": company.get("country", ""),
        "baseCurrency": company.get("base_currency", "USD"),
        "approvalRule": company.get("approval_rule", "hybrid"),
        "approvalThreshold": company.get("approval_threshold", 0.6),
        "workflow": [
            {
                "levelKey": step.get("level_key", ""),
                "label": step.get("label", ""),
            }
            for step in company.get("workflow", [])
        ],
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


def build_auth_payload(user: dict, company: dict):
    return {
        "token": create_access_token(user["id"]),
        "user": serialize_user(user, company=company, include_company=True),
        "company": serialize_company(company),
    }


def create_company_and_admin(payload: dict):
    if find_user_by_email(payload["email"]):
        raise ApiError(409, "A user with this email already exists")

    timestamp = utc_now()
    company = _create_document(
        "companies",
        {
            "name": payload["company_name"].strip(),
            "country": payload["country"].strip(),
            "base_currency": get_default_currency_by_country(payload["country"]),
            "approval_rule": payload.get("approval_rule", "hybrid"),
            "approval_threshold": 0.6,
            "workflow": DEFAULT_WORKFLOW,
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )

    user = _create_document(
        "users",
        {
            "company_id": company["id"],
            "name": payload["admin_name"].strip(),
            "email": clean_email(payload["email"]),
            "password_hash": hash_password(payload["password"]),
            "role": "admin",
            "approval_roles": ["finance", "director", "cfo"],
            "manager_id": None,
            "title": "Company Admin",
            "department": "Finance",
            "is_active": True,
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )

    return build_auth_payload(user, company)


def login_user(payload: dict):
    user = find_user_by_email(payload["email"])
    if not user or not verify_password(payload["password"], user.get("password_hash", "")):
        raise ApiError(401, "Invalid email or password")

    company = get_company_by_id(user["company_id"])
    if not company:
        raise ApiError(404, "Company not found")

    return build_auth_payload(user, company)


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

    approval_roles = [role for role in payload.get("approval_roles", []) if role in {"manager", "finance", "director", "cfo"}]
    if payload["role"] == "manager" and "manager" not in approval_roles:
        approval_roles.append("manager")
    if payload["role"] == "admin" and not approval_roles:
        approval_roles.extend(["finance", "director"])

    timestamp = utc_now()
    user = _create_document(
        "users",
        {
            "company_id": current_user["company_id"],
            "name": payload["name"].strip(),
            "email": clean_email(payload["email"]),
            "password_hash": hash_password(payload["password"]),
            "role": payload["role"],
            "approval_roles": approval_roles,
            "manager_id": manager_id or None,
            "title": payload.get("title", "").strip(),
            "department": payload.get("department", "").strip(),
            "is_active": True,
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )

    return serialize_user(user, manager=manager)


def list_users_for_actor(current_user: dict):
    users = list_company_users(current_user["company_id"])
    user_map = {user["id"]: user for user in users}

    if current_user.get("role") == "manager":
        team_users = [user for user in users if user["id"] == current_user["id"] or user.get("manager_id") == current_user["id"]]
    else:
        team_users = users

    return [
        serialize_user(user, manager=user_map.get(user.get("manager_id")))
        for user in team_users
    ]


def resolve_workflow_approvers(employee: dict, company: dict, users: list[dict]):
    manager_approver = next((user for user in users if user["id"] == employee.get("manager_id")), None)
    if not manager_approver:
        manager_approver = next((user for user in users if user.get("role") == "manager"), None)
    if not manager_approver:
        manager_approver = next((user for user in users if user.get("role") == "admin"), None)

    finance_approver = next((user for user in users if "finance" in user.get("approval_roles", [])), None)
    if not finance_approver:
        finance_approver = next((user for user in users if user.get("role") == "admin"), None)

    director_approver = next(
        (
            user
            for user in users
            if "director" in user.get("approval_roles", []) or "cfo" in user.get("approval_roles", [])
        ),
        None,
    )
    if not director_approver:
        director_approver = next((user for user in users if user.get("role") == "admin"), None) or finance_approver

    steps = []
    for index, step in enumerate(company.get("workflow", DEFAULT_WORKFLOW), start=1):
        if step.get("level_key") == "manager":
            approver = manager_approver
        elif step.get("level_key") == "finance":
            approver = finance_approver or manager_approver
        else:
            approver = director_approver or finance_approver

        if approver:
            steps.append(
                {
                    "level_key": step.get("level_key"),
                    "label": step.get("label"),
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

    serialized = []
    for expense in expenses:
        serialized.append(
            serialize_expense(
                expense,
                employee=user_index.get(expense.get("employee_id")),
                approvals=approval_groups.get(expense["id"], []),
            )
        )
    return serialized


def get_expense_detail(expense_id: str):
    expense = get_expense_by_id(expense_id)
    if not expense:
        raise ApiError(404, "Expense not found")

    company_id = expense["company_id"]
    users, approvals, _expenses = _group_company_data(company_id)
    user_index = _build_user_index(users)
    related_approvals = [approval for approval in approvals if approval.get("expense_id") == expense_id]
    serialized_approvals = [
        serialize_approval(approval, approver=user_index.get(approval.get("approver_id")), acted_by=user_index.get(approval.get("acted_by_id")))
        for approval in sorted(related_approvals, key=lambda item: item.get("step_order", 0))
    ]
    return serialize_expense(expense, employee=user_index.get(expense.get("employee_id")), approvals=serialized_approvals)


def create_expense_record(current_user: dict, payload: dict):
    company = current_user["company"]
    expense_date = parse_iso_date(payload["expense_date"])
    conversion = convert_currency(payload["amount"], payload["currency"], company.get("base_currency", "USD"))
    timestamp = utc_now()

    expense = _create_document(
        "expenses",
        {
            "company_id": current_user["company_id"],
            "employee_id": current_user["id"],
            "submitted_amount": round(payload["amount"], 2),
            "submitted_currency": payload["currency"].strip().upper(),
            "converted_amount": conversion["converted_amount"],
            "company_currency": company.get("base_currency", "USD"),
            "exchange_rate": conversion["rate"],
            "conversion_source": conversion["source"],
            "category": payload["category"].strip(),
            "description": payload["description"].strip(),
            "vendor_name": payload.get("vendor_name", "").strip(),
            "expense_date": expense_date,
            "receipt_image_path": payload.get("receipt_image_path", ""),
            "ocr_meta": {
                "text": payload.get("ocr_meta", {}).get("text", ""),
                "extracted_amount": payload.get("ocr_meta", {}).get("extracted_amount"),
                "extracted_date": payload.get("ocr_meta", {}).get("extracted_date", ""),
                "vendor_name": payload.get("ocr_meta", {}).get("vendor_name", ""),
            },
            "status": "pending",
            "current_step_order": 1,
            "final_decision_reason": "",
            "created_at": timestamp,
            "updated_at": timestamp,
        },
    )

    users = list_company_users(current_user["company_id"])
    steps = resolve_workflow_approvers(current_user, company, users)
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
    batch.commit()

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
    users, approvals, expenses = _group_company_data(current_user["company_id"])
    user_index = _build_user_index(users)
    expense_index = {expense["id"]: expense for expense in expenses}

    pending = [
        approval
        for approval in approvals
        if approval.get("status") == "pending" and approval.get("is_current")
    ]

    if current_user.get("role") != "admin":
        pending = [approval for approval in pending if approval.get("approver_id") == current_user["id"]]

    pending = sorted(pending, key=lambda item: item.get("created_at") or datetime.min)

    serialized = []
    for approval in pending:
        expense = expense_index.get(approval.get("expense_id"))
        expense_payload = (
            serialize_expense(expense, employee=user_index.get(expense.get("employee_id"))) if expense else None
        )
        serialized.append(
            serialize_approval(
                approval,
                approver=user_index.get(approval.get("approver_id")),
                acted_by=user_index.get(approval.get("acted_by_id")),
                expense=expense_payload,
            )
        )
    return serialized


def _cfo_approved(approvals: list[dict], users: list[dict], current_user: dict):
    if "cfo" in current_user.get("approval_roles", []):
        return True
    user_index = _build_user_index(users)
    for approval in approvals:
        if approval.get("status") == "approved":
            approver = user_index.get(approval.get("approver_id"))
            if approver and "cfo" in approver.get("approval_roles", []):
                return True
    return False


def should_finalize_approval(company: dict, approvals: list[dict], users: list[dict], current_user: dict):
    approved_count = len([approval for approval in approvals if approval.get("status") == "approved"])
    total_count = len(approvals) or 1
    approved_ratio = approved_count / total_count
    all_approved = approved_count == total_count
    meets_percentage = approved_ratio >= float(company.get("approval_threshold", 0.6))
    cfo_approved = _cfo_approved(approvals, users, current_user)

    if company.get("approval_rule") == "percentage":
        return all_approved or meets_percentage
    if company.get("approval_rule") == "specific":
        return all_approved or cfo_approved
    return all_approved or meets_percentage or cfo_approved


def finalize_expense_status(expense_id: str, status: str, reason: str):
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
    return get_expense_detail(expense_id)


def process_approval_action(current_user: dict, approval_id: str, action: str, comment: str = ""):
    approval = get_approval_by_id(approval_id)
    if not approval:
        raise ApiError(404, "Approval not found")

    if approval.get("status") != "pending" or not approval.get("is_current"):
        raise ApiError(400, "This approval step is no longer active")

    can_override = current_user.get("role") == "admin"
    is_assigned_approver = approval.get("approver_id") == current_user["id"]
    if not can_override and not is_assigned_approver:
        raise ApiError(403, "You are not allowed to action this approval")

    timestamp = utc_now()
    _update_document(
        "approvals",
        approval_id,
        {
            "status": "approved" if action == "approve" else "rejected",
            "comment": comment,
            "is_current": False,
            "acted_at": timestamp,
            "acted_by_id": current_user["id"],
            "updated_at": timestamp,
        },
    )

    if action == "reject":
        expense = finalize_expense_status(approval["expense_id"], "rejected", comment or "Rejected during approval")
        return {"expense": expense}

    expense = get_expense_by_id(approval["expense_id"])
    approvals = list_expense_approvals(approval["expense_id"])
    users = list_company_users(current_user["company_id"])

    if should_finalize_approval(current_user["company"], approvals, users, current_user):
        reason = (
            "Approved because CFO approval was received"
            if "cfo" in current_user.get("approval_roles", [])
            else "Approved because threshold or workflow completion was reached"
        )
        expense = finalize_expense_status(approval["expense_id"], "approved", reason)
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

    return {"expense": get_expense_detail(approval["expense_id"])}


def clear_collection(collection_name: str):
    for document in _list_all(collection_name):
        _collection(collection_name).document(document["id"]).delete()
