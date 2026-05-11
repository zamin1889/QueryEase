"""Local and Cloud LLM inference utilities for QueryEase."""

from __future__ import annotations

import os
from typing import Literal

from dotenv import load_dotenv
import requests
from requests import Response
from requests.exceptions import ReadTimeout, RequestException

load_dotenv()

# --- Configurations ---
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "queryease-sql"
DEFAULT_OLLAMA_TIMEOUT_SECONDS = 120.0

NIM_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NIM_MODEL = "meta/llama-3.3-70b-instruct"


def _get_timeout_seconds() -> float:
    """Resolve the Ollama request timeout in seconds."""
    raw_timeout = os.getenv("OLLAMA_TIMEOUT_SECONDS", "").strip()
    if not raw_timeout:
        return DEFAULT_OLLAMA_TIMEOUT_SECONDS

    try:
        parsed = float(raw_timeout)
    except ValueError:
        return DEFAULT_OLLAMA_TIMEOUT_SECONDS

    if parsed <= 0:
        return DEFAULT_OLLAMA_TIMEOUT_SECONDS

    return parsed


def _get_system_instructions(schema_context: str) -> str:
    """Returns the strict system instructions and schema."""
    return (
        "You are a senior PostgreSQL data analyst and an expert in deterministic SQL generation. "
        "Your job is to generate accurate, safe, and strictly read-only SQL queries based on the user's request.\n\n"
        "CRITICAL POSTGRESQL RULES:\n"
        "1. NEVER generate mutations (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE). Only generate SELECT statements.\n"
        "2. ALWAYS wrap ALL table names and column names in double quotes (e.g., \"global_superstore\", \"Order Date\").\n"
        "3. DATE COLUMNS: Dates are stored natively as strictly typed PostgreSQL DATE. "
        "DO NOT use TO_DATE() on column names. To filter by year or month, use standard date math: "
        "EXTRACT(YEAR FROM \"Order Date\") = 2014 or range comparisons (\"Order Date\" >= '2014-01-01').\n"
        "4. NUMERIC COLUMNS: Columns like Sales, Profit, Quantity, and Discount are strictly typed NUMERIC. "
        "You can use SUM(), AVG(), and math operators natively without casting.\n"
        "5. ONLY output the raw SQL query. Do not include markdown formatting, backticks, or explanations.\n\n"
        "Database schema:\n"
        f"{schema_context.strip()}\n"
    )


def _generate_with_nim(user_query: str, schema_context: str) -> str:
    """Generate SQL using Nvidia NIM (Llama 3.3 70B)."""
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY is not set in the environment.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": NIM_MODEL,
        "messages": [
            {"role": "system", "content": _get_system_instructions(schema_context)},
            {"role": "user", "content": user_query.strip()}
        ],
        "temperature": 0.0,  # Strict deterministic mode
        "max_tokens": 512,
    }

    try:
        response = requests.post(NIM_API_URL, headers=headers, json=payload, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        
        sql_output = data["choices"][0]["message"]["content"]
        
        # Clean up potential markdown formatting from cloud models
        return sql_output.replace("```sql", "").replace("```", "").strip()
        
    except RequestException as exc:
        raise RuntimeError(f"Failed to reach Nvidia NIM: {str(exc)}") from exc


def _generate_with_ollama(user_query: str, schema_context: str) -> str:
    """Generate SQL using local Ollama model."""
    prompt = _get_system_instructions(schema_context) + "\nUser request:\n" + user_query.strip() + "\n"
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    timeout_seconds = max(120.0, _get_timeout_seconds())

    for attempt in range(2):
        try:
            response = requests.post(
                OLLAMA_GENERATE_URL,
                json=payload,
                timeout=timeout_seconds,
            )
            response.raise_for_status()
            
            try:
                data = response.json()
            except ValueError as json_exc:
                raise RuntimeError("Ollama returned non-JSON output.") from json_exc

            sql_output = data.get("response", "")
            if not isinstance(sql_output, str) or not sql_output.strip():
                raise RuntimeError("Ollama response did not include SQL output.")
            
            # Clean up potential markdown formatting
            return sql_output.replace("```sql", "").replace("```", "").strip()
            
        except ReadTimeout as exc:
            if attempt == 0:
                print("Ollama cold start detected, retrying...")
                continue
            raise RuntimeError("Ollama request timed out. Check the service and try again.") from exc
        except RequestException as exc:
            raise RuntimeError("Failed to reach Ollama at http://localhost:11434. Ensure the service is running.") from exc

    raise RuntimeError("Unexpected error in Ollama generation.")


def generate_sql(user_query: str, schema_context: str, provider: Literal["local", "nim"] = "local") -> str:
    """Route the request to the selected LLM provider.

    Args:
        user_query: Natural language request from the client.
        schema_context: Live database schema as CREATE TABLE statements.
        provider: Choice of LLM engine ('local' or 'nim').

    Returns:
        SQL query string generated by the selected model.
    """
    if provider == "nim":
        return _generate_with_nim(user_query, schema_context)
    return _generate_with_ollama(user_query, schema_context)