"""Deterministic SQL sanitization for QueryEase."""

from __future__ import annotations

import re

FORBIDDEN_KEYWORDS = (
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "TRUNCATE",
)

FORBIDDEN_PATTERN = re.compile(r"\b(?:DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE)\b")


def sanitize_sql(sql_query: str) -> str:
    """Validate SQL is read-only and free of destructive keywords.

    Args:
        sql_query: Candidate SQL query string to validate.

    Returns:
        Original SQL query if it is read-only and safe.

    Raises:
        ValueError: When the query attempts a structural mutation.
    """

    if not isinstance(sql_query, str) or not sql_query.strip():
        raise ValueError("Structural mutations are blocked: empty SQL query.")

    stripped_query = sql_query.strip()
    normalized_query = stripped_query.upper()

    if not (
        normalized_query.startswith("SELECT")
        or normalized_query.startswith("WITH")
    ):
        raise ValueError(
            "Structural mutations are blocked: query must start with SELECT or WITH."
        )

    if FORBIDDEN_PATTERN.search(normalized_query):
        raise ValueError(
            "Structural mutations are blocked: forbidden keyword detected."
        )

    return sql_query
