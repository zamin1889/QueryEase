# ARCHITECTURE.md

## 1. Architectural Dimensions & Style

QueryEase implements a **Hybrid / Edge-Cloud Architecture**. Every architectural choice represents a calculated trade-off. We have actively designed a system that allows users to seamlessly switch between cloud-hosted convenience (optimizing for latency and complex semantic routing) and localized edge processing (optimizing for absolute data privacy and immunity to network rate limits).

## 2. Logical Components & Dataflow

Logical components are the functional building blocks of the system. To minimize dependencies and prevent race conditions, our architecture follows a strictly sequential dataflow:

1. **Context Fetching Component:** SQLAlchemy connects to the live PostgreSQL instance and reflects the current schema metadata (DDL) into memory.
2. **Prompt Assembly Component:** Combines the user's natural language input with the fetched database context and system constraints.
3. **Inference Generation Component:** FastAPI routes the payload securely to either the local Ollama instance or the external Cloud API based on the selected tenant configuration.
4. **Deterministic Sanitization Component:** Evaluates the raw SQL string and safely blocks structural mutations prior to database contact.
5. **Execution & Self-Healing Component:** Executes the query. If a `psycopg2` syntax or column error occurs, the error trace is passed back to step 3 for self-correction.
6. **Response Component:** Returns the deterministic, sanitized output payload to the frontend for visualization.

## 3. Database Schema Design

The application utilizes a PostgreSQL relational structure managed via Supabase.

- `global_superstore`: A sprawling retail analytics dataset utilized for testing aggregation, grouping, and financial mathematics.
- `spotify_tracks`: A rich audio and entertainment dataset utilized for evaluating the system's ability to handle boolean logic and high-variance numeric ranges.
- `chat_history`: A core system table storing application state. It indexes `session_id` (linked to Supabase Auth UUIDs), `user_query`, `generated_sql`, `chart_type`, and timestamps.

## 4. Data Flow (State Persistence & History)

1. **Initial Mount:** Upon authentication, React reads the active user UUID and fires a `GET /api/v1/history` request with a default load limit of 10.
2. **Re-execution Mechanism:** To prevent storing massive, redundant JSON payloads, FastAPI fetches only the saved SQL strings and dynamically re-executes them against the live PostgreSQL database. This guarantees the UI charts reflect the current database state.
3. **Pagination Strategy:** The frontend utilizes an `offset` state tracker. Triggering "Load Previous" fetches the next batch of historical queries, securely bounding the amount of data transferred and preventing client-side memory degradation.

## 5. The MLOps Evaluation Loop

To track prompt accuracy and prevent unmonitored model drift, the system utilizes a dedicated MLOps evaluation script (`evaluate.py`).

- **Execution-Based Metric:** The pipeline does not measure accuracy via string-matching (which is flawed due to syntax variance). It executes the Golden Standard SQL, executes the AI SQL, and evaluates the final array of rows returned to calculate true operational accuracy.
- **I/O Tracking:** The system comprehensively logs Execution Success, Data Accuracy, Average Latency, and the "Self-Healing Index" (average retries required to generate valid code).
