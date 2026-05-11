"""Database connection and schema extraction utilities for QueryEase."""

from __future__ import annotations

import os
from datetime import date, datetime, time
from decimal import Decimal
from enum import Enum
from uuid import UUID

from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.schema import CreateTable

load_dotenv()

_ENGINE: Engine | None = None


def get_engine() -> Engine:
    """Create or return a cached SQLAlchemy engine.

    Returns:
        SQLAlchemy engine configured from DATABASE_URL.

    Raises:
        RuntimeError: When DATABASE_URL is missing or engine creation fails.
    """
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set. Check your .env file.")

    try:
        _ENGINE = create_engine(database_url, pool_pre_ping=True, future=True)
    except SQLAlchemyError as exc:
        raise RuntimeError("Failed to create SQLAlchemy engine.") from exc

    return _ENGINE


def get_live_schema(engine: Engine) -> str:
    """Reflect the live database schema as CREATE TABLE statements.

    Args:
        engine: SQLAlchemy engine for the target database.

    Returns:
        Schema serialized as raw CREATE TABLE statements, separated by blank lines.

    Raises:
        RuntimeError: When schema reflection fails due to connection issues.
    """
    metadata = MetaData()
    try:
        with engine.connect() as connection:
            metadata.reflect(bind=connection)
    except (SQLAlchemyError, OSError) as exc:
        raise RuntimeError(
            "Failed to connect to the database and reflect schema."
        ) from exc

    statements: list[str] = []
    for table in metadata.sorted_tables:
        statement = str(CreateTable(table).compile(dialect=engine.dialect)).strip()
        if statement and not statement.endswith(";"):
            statement += ";"
        if statement:
            statements.append(statement)

    return "\n\n".join(statements)


def _serialize_value(value: object) -> object:
    """Convert database values into JSON-serializable primitives.

    Args:
        value: Value to convert to standard Python types.

    Returns:
        JSON-friendly representation of the input value.
    """
    if value is None or isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (datetime, date, time)):
        return value.isoformat()

    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")

    if isinstance(value, memoryview):
        return value.tobytes().decode("utf-8", errors="replace")

    if isinstance(value, Enum):
        return _serialize_value(value.value)

    if isinstance(value, dict):
        return {str(key): _serialize_value(item) for key, item in value.items()}

    if isinstance(value, (list, tuple)):
        return [_serialize_value(item) for item in value]

    return str(value)


def execute_query(engine: Engine, sql_string: str) -> list[dict[str, object]]:
    """Execute a raw SQL query and return JSON-safe row dictionaries.

    Args:
        engine: SQLAlchemy engine for the target database.
        sql_string: SQL query string to execute.

    Returns:
        List of result rows, each represented as a column-name dictionary.

    Raises:
        RuntimeError: When execution fails due to connection or SQL errors.
        ValueError: When the SQL query string is empty.
    """
    if not isinstance(sql_string, str) or not sql_string.strip():
        raise ValueError("SQL query string is empty.")

    try:
        with engine.connect() as connection:
            result = connection.execute(text(sql_string))
            rows = result.mappings().all()
    except (SQLAlchemyError, OSError) as exc:
        # Explicitly raise RuntimeError with the exact DB error string
        # so the LLM Self-Healing loop can read it and learn from it.
        raise RuntimeError(f"Database error: {str(exc)}") from exc

    return [
        {key: _serialize_value(value) for key, value in row.items()}
        for row in rows
    ]