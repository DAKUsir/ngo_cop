# ==========================================
# Stage 1: Build the Next.js Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy the rest of the frontend code
COPY frontend/ ./

# Build the Next.js application (static export)
# NEXT_PUBLIC_API_URL is empty for production so it uses relative paths
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build


# ==========================================
# Stage 2: Build the FastAPI Backend & Serve
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required (e.g., for pandas/numpy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Copy the statically exported frontend from Stage 1
COPY --from=frontend-builder /app/frontend/out ./frontend/out

# Set environment variables for production
ENV PYTHONUNBUFFERED=1
# The PORT environment variable is automatically injected by Render
ENV PORT=8000

# Expose the port
EXPOSE $PORT

# Change working directory to backend so uvicorn can find app.main
WORKDIR /app/backend

# Start FastAPI
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
