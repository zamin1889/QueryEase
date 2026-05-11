"""Deterministic SQL sanitization for QueryEase."""

from __future__ import annotations

import re

# Expanded list to include schema-altering and administrative commands
FORBIDDEN_KEYWORDS = (
    "ALTER",
    "CALL",
    "COMMIT",
    "CREATE",
    "DELETE",
    "DO",
    "DROP",
    "EXECUTE",
    "GRANT",
    "INSERT",
    "MERGE",
    "REPLACE",
    "REVOKE",
    "ROLLBACK",
    "TRUNCATE",
    "UPDATE",
)

# Dynamically build the regex pattern to avoid repeating strings
FORBIDDEN_PATTERN = re.compile(rf"\b(?:{'|'.join(FORBIDDEN_KEYWORDS)})\b", re.IGNORECASE)


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
    
    # 1. Block stacked queries (multiple statements)
    # Semicolons are only allowed if it is the absolute last character.
    if ";" in stripped_query[:-1]:
        raise ValueError(
            "Structural mutations are blocked: multiple SQL statements detected."
        )

    normalized_query = stripped_query.upper()

    # 2. Must start with a read-only keyword
    if not (
        normalized_query.startswith("SELECT")
        or normalized_query.startswith("WITH")
    ):
        raise ValueError(
            "Structural mutations are blocked: query must start with SELECT or WITH."
        )

    # 3. Block all destructive/administrative keywords
    if FORBIDDEN_PATTERN.search(normalized_query):
        raise ValueError(
            "Structural mutations are blocked: forbidden keyword detected."
        )

    return stripped_query