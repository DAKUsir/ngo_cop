from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database.mongodb import create_indexes
from app.routers import auth, upload, dashboard, analytics, report
from app.utils.auth import get_current_user
from app.models.schemas import UserOut

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    yield


app = FastAPI(
    title="ImpactLens API",
    description="AI-Powered NGO Impact Reporting Copilot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router,      prefix="/api")
app.include_router(upload.router,    prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(report.router,    prefix="/api")


@app.get("/")
async def root():
    return {"message": "ImpactLens API is running 🚀", "docs": "/docs"}
