from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import approvals, auth, expenses, users
from app.core.config import get_settings
from app.core.exceptions import ApiError

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.upload_dir)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.exception_handler(ApiError)
async def api_error_handler(_request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "errors": exc.errors,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request, exc: RequestValidationError):
    errors = {}
    for item in exc.errors():
        field_path = item.get("loc", [])
        field_name = field_path[-1] if field_path else "field"
        errors[str(field_name)] = item.get("msg", "Invalid value")

    return JSONResponse(
        status_code=422,
        content={
            "message": "Please fix the highlighted fields",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(_request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": str(exc) or "Something went wrong",
            "errors": None,
        },
    )


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI reimbursement service is healthy"}


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["approvals"])
