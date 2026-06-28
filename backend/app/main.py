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

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Include routers (API routes must be registered before the catch-all)
app.include_router(auth.router,      prefix="/api")
app.include_router(upload.router,    prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(report.router,    prefix="/api")

# Serve Frontend
FRONTEND_OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "out"))

if os.path.isdir(FRONTEND_OUT):
    app.mount("/_next", StaticFiles(directory=os.path.join(FRONTEND_OUT, "_next")), name="next")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # 1. Exact file (e.g., favicon.ico)
        exact_path = os.path.join(FRONTEND_OUT, full_path)
        if os.path.isfile(exact_path):
            return FileResponse(exact_path)
        
        # 2. HTML file (e.g., /dashboard -> dashboard.html)
        html_path = os.path.join(FRONTEND_OUT, full_path + ".html")
        if os.path.isfile(html_path):
            return FileResponse(html_path)
            
        # 3. Directory index (e.g., /dashboard/ -> dashboard/index.html)
        dir_index_path = os.path.join(FRONTEND_OUT, full_path, "index.html")
        if os.path.isfile(dir_index_path):
            return FileResponse(dir_index_path)
            
        # 4. Fallback root index.html
        root_index = os.path.join(FRONTEND_OUT, "index.html")
        if os.path.isfile(root_index):
            return FileResponse(root_index)
            
        return {"error": "Frontend route not found"}
else:
    @app.get("/")
    async def root():
        return {"message": "ImpactLens API is running 🚀. Frontend not built yet.", "docs": "/docs"}
