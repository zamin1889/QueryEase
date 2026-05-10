"""FastAPI application entrypoint for QueryEase."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# 1. ADDED execute_query IMPORT
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


@app.post(
    "/api/v1/query",
    response_model=QuerySuccessResponse, # 2. REMOVED list[] WRAPPER
    responses={
        500: {"model": QueryErrorResponse},
    },
)
def query_text_to_sql(
    payload: QueryRequest,
    simulate_error: bool = False,
) -> QuerySuccessResponse: # 2. REMOVED list[] WRAPPER
    """Handle text-to-SQL requests."""

    if simulate_error:
        raise HTTPException(status_code=500, detail="Simulated failure for contract testing.")

    engine = get_engine()
    schema_context = get_live_schema(engine)
    
    # 3. ADDED THE SELF-HEALING AGENTIC LOOP
    max_retries = 3
    retry_count = 0
    current_query = payload.user_query

    while retry_count <= max_retries:
        try:
            # Step A: Generate SQL
            generated_sql = generate_sql(current_query, schema_context)
            
            # Step B: Sanitize
            try:
                safe_sql = sanitize_sql(generated_sql)
            except ValueError as exc:
                # If malicious, stop the loop entirely and return 400
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

            # Step D: Return Actual Data
            return QuerySuccessResponse(
                status="success",
                generated_sql=safe_sql,
                execution_time_ms=0,
                retries_used=retry_count,
                data=results,  # <--- INJECTING THE REAL DATA
                inferred_chart_type="table",
            )

        except HTTPException:
            raise # Re-raise explicit HTTP exceptions (like our 400 Security trap)
        
        except Exception as exc:
            # Catch execution/syntax errors and loop to self-heal
            retry_count += 1
            if retry_count > max_retries:
                error_response = QueryErrorResponse(
                    error_code="GENERATION_FAILED_AFTER_RETRIES",
                    error_message="Failed to generate valid SQL after maximum retries.",
                    details={"reason": str(exc)},
                )
                raise HTTPException(
                    status_code=500,
                    detail=error_response.model_dump(),
                ) from exc
            
            # Append the error to the prompt to teach the AI what went wrong
            current_query = f"{payload.user_query}\n\nPrevious attempt failed with error: {str(exc)}. Please fix the SQL query."

    # Fallback
    raise HTTPException(status_code=500, detail="Unexpected loop exit.")