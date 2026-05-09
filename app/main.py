"""FastAPI application entrypoint for QueryEase."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import get_engine, get_live_schema
from app.llm import generate_sql
from app.schemas import QueryErrorResponse, QueryRequest, QuerySuccessResponse

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
    response_model=list[QuerySuccessResponse],
    responses={
        500: {"model": QueryErrorResponse},
    },
)
def query_text_to_sql(
    payload: QueryRequest,
    simulate_error: bool = False,
) -> list[QuerySuccessResponse]:
    """Handle text-to-SQL requests.

    Args:
        payload: Incoming query request.

    Returns:
        Generated SQL response payload.
    """

    try:
        if simulate_error:
            raise RuntimeError("Simulated failure for contract testing.")

        engine = get_engine()
        schema_context = get_live_schema(engine)
        generated_sql = generate_sql(payload.user_query, schema_context)

        return QuerySuccessResponse(
                status="success",
                generated_sql=generated_sql,
                execution_time_ms=0,
                retries_used=0,
                data=[],
                inferred_chart_type="table",
                )
    
    except Exception as exc:
        error_response = QueryErrorResponse(
            error_code="INTERNAL_SERVER_ERROR",
            error_message="Failed to generate SQL.",
            details={"reason": str(exc)},
        )
        raise HTTPException(
            status_code=500,
            detail=error_response.model_dump(),
        ) from exc
