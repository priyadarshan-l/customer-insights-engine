# backend.Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies needed for some ML packages (like gcc for compiling)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything necessary for the backend to run
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY models/ ./models/
COPY data/ ./data/

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose the API port
EXPOSE 8000

# Run uvicorn server
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
