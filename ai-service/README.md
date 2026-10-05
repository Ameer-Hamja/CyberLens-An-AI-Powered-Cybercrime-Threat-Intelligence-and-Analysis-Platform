---
title: CrimeLens AI Service
sdk: docker
app_port: 8000
license: mit
---

# CrimeLens AI Service

FastAPI-based NLP classification service for the CrimeLens platform.

## Features
- **Transformer NLP**: Uses XLM-RoBERTa for multilingual threat classification
- **Rule-based Fallback**: Regex-based heuristic classifier for high reliability
- **Citizen Scanner**: Explainable AI for end-users to scan suspicious texts/URLs

## Running locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Running tests

```bash
pytest
```
