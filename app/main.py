"""FastAPI application entrypoint for QueryEase."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import get_engine, get_live_schema, execute_query
from app.llm import generate_sql
from app.schemas import QueryErrorResponse, QueryRequest, QuerySuccessResponse
from app.sanitizer import sanitize_sql

app = FastAPI(title="QueryEase API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    """Return HTTPException details as a structured JSON response."""
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.get("/health")
def health_check() -> dict[str, str]:
    """Return a basic health status payload."""
    return {"status": "healthy"}

@app.get("/api/v1/history/{session_id}")
def get_chat_history(session_id: str, limit: int = 10, offset: int = 0):
    """Fetch past chat history with pagination and a safety cap on row counts."""
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Fetch one extra row to see if there is more history left
            fetch_limit = limit + 1
            result = conn.execute(
                text("""
                    SELECT user_query, generated_sql, chart_type 
                    FROM chat_history 
                    WHERE session_id = :session_id 
                    ORDER BY created_at DESC 
                    LIMIT :limit OFFSET :offset
                """),
                {"session_id": session_id, "limit": fetch_limit, "offset": offset}
            )
            rows = result.mappings().all()
            
            # Determine if there are more messages to load
            has_more = len(rows) > limit
            
            # Slice off the extra row and reverse the list so it displays chronologically
            display_rows = rows[:limit][::-1]
            
            history = []
            for row in display_rows:
                data_rows = []
                try:
                    # RIGOROUS FIX: Append a LIMIT 100 to the past SQL
                    base_sql = row["generated_sql"].rstrip(";")
                    limited_sql = f"SELECT * FROM ({base_sql}) AS subquery LIMIT 100"
                    
                    data_rows = execute_query(engine, limited_sql)
                except Exception as query_exc:
                    print(f"[DEBUG] History re-execution failed: {query_exc}")
                    
                history.append({
                    "user_query": row["user_query"],
                    "generated_sql": row["generated_sql"],
                    "chart_type": row["chart_type"] or "table",
                    "data": data_rows
                })
            return {"status": "success", "history": history, "has_more": has_more}
    except Exception as e:
        print(f"[DEBUG] History fetch error: {e}")
        return {"status": "error", "history": [], "has_more": False}

@app.post(
    "/api/v1/query",
    response_model=QuerySuccessResponse,
    responses={
        500: {"model": QueryErrorResponse},
    },
)
def query_text_to_sql(
    payload: QueryRequest,
    simulate_error: bool = False,
) -> QuerySuccessResponse:
    """Handle text-to-SQL requests."""

    if simulate_error:
        raise HTTPException(status_code=500, detail="Simulated failure for contract testing.")

    engine = get_engine()
    schema_context = get_live_schema(engine)
    
    max_retries = 3
    retry_count = 0
    current_query = payload.user_query

    while retry_count <= max_retries:
        try:
            # Step A: Generate SQL
            print(f"\n[DEBUG] --- ATTEMPT {retry_count} using {payload.provider.upper()} ---")
            generated_sql = generate_sql(current_query, schema_context, payload.provider)
            print(f"[DEBUG] Generated SQL:\n{generated_sql}\n")
            
            # Step B: Sanitize
            try:
                safe_sql = sanitize_sql(generated_sql)
            except ValueError as exc:
                print(f"[DEBUG] Sanitization failed: {exc}")
                error_response = QueryErrorResponse(
                    error_code="SECURITY_VIOLATION",
                    error_message=str(exc),
                    details={"reason": str(exc)},
                )
                raise HTTPException(
                    status_code=400,
                    detail=error_response.model_dump(),
                ) from exc

            # Step C: Execute Query Against Supabase
            results = execute_query(engine, safe_sql)
            print(f"[DEBUG] Query Execution Successful! Rows returned: {len(results)}")

            # --- NEW: Securely commit chat history to database ---
            try:
                with engine.begin() as conn: # engine.begin() acts as a transaction that auto-commits
                    conn.execute(
                        text("""
                        INSERT INTO chat_history 
                        (session_id, tenant_id, user_query, generated_sql, chart_type, execution_time_ms)
                        VALUES (:session_id, :tenant_id, :user_query, :generated_sql, :chart_type, :execution_time_ms)
                        """),
                        {
                            "session_id": payload.session_id,
                            "tenant_id": payload.tenant_id,
                            "user_query": payload.user_query,
                            "generated_sql": safe_sql,
                            "chart_type": "table",
                            "execution_time_ms": 0
                        }
                    )
            except Exception as e:
                print(f"[DEBUG] Failed to save chat history: {e}")
            # -----------------------------------------------------

            # Step D: Return Actual Data
            return QuerySuccessResponse(
                status="success",
                generated_sql=safe_sql,
                execution_time_ms=0,
                retries_used=retry_count,
                data=results,
                inferred_chart_type="table",
            )

        except HTTPException:
            raise 
        
        except Exception as exc:
            # THIS IS THE LOUD ERROR WE NEED TO SEE
            print(f"[DEBUG] Execution Error on Attempt {retry_count}: {exc}")
            
            retry_count += 1
            if retry_count > max_retries:
                print("[DEBUG] Max retries reached. Failing request.")
                error_response = QueryErrorResponse(
                    error_code="GENERATION_FAILED_AFTER_RETRIES",
                    error_message="Failed to generate valid SQL after maximum retries.",
                    details={"reason": str(exc)},
                )
                raise HTTPException(
                    status_code=500,
                    detail=error_response.model_dump(),
                ) from exc
            
            current_query = f"{payload.user_query}\n\nPrevious attempt failed with error: {str(exc)}. Please fix the SQL query."

    raise HTTPException(status_code=500, detail="Unexpected loop exit.")