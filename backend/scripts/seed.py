from app.core.security import delete_firebase_user_by_email
from app.services.reimbursement_service import (
    clear_collection,
    create_company_and_admin,
    create_expense_record,
    create_user_record,
    find_user_by_email,
    get_company_by_id,
    get_user_by_id,
    list_pending_approvals,
    process_approval_action,
)


def with_company(user: dict):
    user["company"] = get_company_by_id(user["company_id"])
    return user


def main():
    for email in ["admin@acme.local", "manager@acme.local", "employee@acme.local", "nisha@acme.local"]:
        delete_firebase_user_by_email(email)

    for collection_name in ["audit_logs", "approvals", "expenses", "users", "companies"]:
        clear_collection(collection_name)

    create_company_and_admin(
        {
            "company_name": "Acme Reimbursements",
            "country": "India",
            "admin_name": "Aarav Admin",
            "email": "admin@acme.local",
            "password": "password123",
            "approval_rule": "hybrid",
        }
    )

    admin = with_company(find_user_by_email("admin@acme.local"))

    create_user_record(
        admin,
        {
            "name": "Mira Manager",
            "email": "manager@acme.local",
            "password": "password123",
            "role": "manager",
            "manager_id": None,
            "department": "Operations",
            "title": "Operations Manager",
            "approval_roles": ["manager"],
        },
    )

    manager = with_company(find_user_by_email("manager@acme.local"))

    create_user_record(
        admin,
        {
            "name": "Eshan Employee",
            "email": "employee@acme.local",
            "password": "password123",
            "role": "employee",
            "manager_id": manager["id"],
            "department": "Sales",
            "title": "Sales Executive",
            "approval_roles": [],
        },
    )
    create_user_record(
        admin,
        {
            "name": "Nisha Employee",
            "email": "nisha@acme.local",
            "password": "password123",
            "role": "employee",
            "manager_id": manager["id"],
            "department": "Support",
            "title": "Support Associate",
            "approval_roles": [],
        },
    )

    employee = with_company(find_user_by_email("employee@acme.local"))
    second_employee = with_company(find_user_by_email("nisha@acme.local"))

    create_expense_record(
        employee,
        {
            "amount": 250,
            "currency": "USD",
            "category": "Travel",
            "description": "Client visit to Bengaluru",
            "expense_date": "2026-03-29",
            "vendor_name": "Airline Desk",
            "receipt_image_path": "",
            "ocr_meta": {},
        },
    )

    approved_expense = create_expense_record(
        second_employee,
        {
            "amount": 5200,
            "currency": "INR",
            "category": "Meals",
            "description": "Team lunch with support shift staff",
            "expense_date": "2026-03-28",
            "vendor_name": "Cafe Amber",
            "receipt_image_path": "",
            "ocr_meta": {},
        },
    )

    manager_pending = list_pending_approvals(manager)
    manager_approval = next(item for item in manager_pending if item["expense"]["_id"] == approved_expense["_id"])
    process_approval_action(manager, manager_approval["_id"], "approve", "Looks good")

    admin_pending = list_pending_approvals(admin)
    admin_approval = next(item for item in admin_pending if item["expense"]["_id"] == approved_expense["_id"])
    process_approval_action(admin, admin_approval["_id"], "approve", "Approved by finance")

    print("Seed completed")
    print("Admin: admin@acme.local / password123")
    print("Manager: manager@acme.local / password123")
    print("Employee: employee@acme.local / password123")


if __name__ == "__main__":
    main()
