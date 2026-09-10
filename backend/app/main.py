import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.core.database import init_database, async_session_factory
from backend.app.core.exceptions import AppError
from backend.app.core.logging import logger
from backend.app.core.telemetry import metrics, current_request_id, current_trace_id
from backend.app.services.seed_service import SeedService

from backend.app.api.auth import router as auth_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.cycles import router as cycles_router
from backend.app.api.observations import router as observations_router
from backend.app.api.decisions import router as decisions_router
from backend.app.api.approvals import router as approvals_router
from backend.app.api.actions import router as actions_router
from backend.app.api.evaluations import router as evaluations_router
from backend.app.api.agents import router as agents_router
from backend.app.api.memory import router as memory_router
from backend.app.api.policies import router as policies_router
from backend.app.api.integrations import router as integrations_router
from backend.app.api.audit import router as audit_router
from backend.app.api.health import router as health_router
from backend.app.api.settings import router as settings_router
from backend.app.api.simulations import router as simulations_router
from backend.app.api.websocket import router as websocket_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed initial enterprise state
    logger.info("Initializing database tables and enterprise seed data...")
    await init_database()
    async with async_session_factory() as session:
        await SeedService.seed_all(session)
    logger.info("Autonomous AI Business Operations Manager initialized successfully.")
    yield
    # Shutdown
    logger.info("Application shutdown completed.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous AI Business Operations Manager — Observe, Decide, Critique, Guardrail, Act, Evaluate, Adapt",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID & Tracing Middleware
@app.middleware("http")
async def trace_and_log_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    trace_id = request.headers.get("X-Trace-ID", uuid.uuid4().hex)
    
    current_request_id.set(req_id)
    current_trace_id.set(trace_id)

    start_time = time.perf_counter()
    response = await call_next(request)
    process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

    response.headers["X-Request-ID"] = req_id
    response.headers["X-Trace-ID"] = trace_id
    response.headers["X-Process-Time-Ms"] = str(process_time_ms)

    metrics.record_latency("api_latency_ms", process_time_ms)

    if not request.url.path.startswith("/health"):
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} in {process_time_ms}ms",
            extra={"request_id": req_id, "trace_id": trace_id, "event": "http_request"}
        )

    return response


# Exception Handlers
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    req_id = current_request_id.get() or str(uuid.uuid4())
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": req_id,
                "details": exc.details,
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    req_id = current_request_id.get() or str(uuid.uuid4())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "request_id": req_id,
                "details": exc.errors(),
            }
        }
    )


# Register all API routers
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(cycles_router, prefix="/api")
app.include_router(observations_router, prefix="/api")
app.include_router(decisions_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")
app.include_router(actions_router, prefix="/api")
app.include_router(evaluations_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
app.include_router(policies_router, prefix="/api")
app.include_router(integrations_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(simulations_router, prefix="/api")
app.include_router(websocket_router)



@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "architecture": "ODAEA (Observe -> Decide -> Critique -> Guardrail -> Act -> Evaluate -> Adapt)",
        "status": "OPERATIONAL",
        "api_docs": "/docs",
    }
