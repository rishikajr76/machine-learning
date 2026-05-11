# Self-Correction Code Review Agent (Backend)

A production-grade, asynchronous backend for an autonomous code review agent using a multi-agent "Critique-and-Refine" loop orchestrated by LangGraph.

## Features
- **Multi-Agent System**: Proposer, Critic, and Evaluator agents.
- **LangGraph Orchestration**: Robust state management and conditional loop logic.
- **Vector Memory**: Lessons learned from evaluations are stored in ChromaDB for future context.
- **Real-time Feedback**: WebSocket integration for live progress updates.
- **Asynchronous Execution**: Celery + Redis for background processing.
- **Static Analysis**: Pylint, Bandit, and Mypy integration.
- **Secure Sandbox**: (Local mode) Subprocess execution for patch validation.

## Local Setup (Non-Docker)

### 1. Prerequisites
- **Python**: 3.10+
- **PostgreSQL**: Running locally or on a reachable host.
- **Redis**: Running locally (used for Celery broker).
- **ChromaDB**: Running locally (`pip install chromadb` and run `chroma run --path ./chroma_db`).

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` and `CELERY_BROKER_URL` point to your local instances.

### 3. Installation
```bash
pip install -r requirements/dev.txt
```

### 4. Database Migrations
```bash
alembic upgrade head
```

### 5. Running the Application

#### Start the API Server:
```bash
uvicorn app.main:app --reload
```

#### Start the Celery Worker:
```bash
celery -A app.workers.celery_app:celery_app worker --loglevel=info
```

#### Start ChromaDB (if not running):
```bash
chroma run --path ./chroma_db --port 8000
```

## API Documentation
Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing
```bash
pytest
```
