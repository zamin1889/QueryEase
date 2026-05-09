# API_CONTRACT.md

This document outlines the foundational API agreements between the React frontend and the FastAPI backend.

## 1. Global Endpoints

Base URL: Defined via `VITE_API_URL` (Pointing to the Ngrok static domain).

## 2. Text-to-SQL Generation

**Endpoint:** `POST /api/v1/query`
**Description:** Accepts a natural language query, generates the SQL, executes it against the database, and returns the result payload.

### Request Payload

```json
{
  "user_query": "Show me the top 5 customers by revenue this month",
  "session_id": "uuid-1234",
  "tenant_id": "tenant-5678"
}
