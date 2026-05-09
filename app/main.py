"""FastAPI application entrypoint for QueryEase."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import QueryErrorResponse, QueryRequest, QuerySuccessResponse

app = FastAPI(title="QueryEase API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

HARDCODED_QUERY_SUCCESS_RESPONSE: list[QuerySuccessResponse] = [
    QuerySuccessResponse(
        status="success",
        generated_sql=(
            "SELECT customer_name, SUM(revenue) as total FROM sales "
            "WHERE month = 'current' GROUP BY customer_name "
            "ORDER BY total DESC LIMIT 5;"
        ),
        execution_time_ms=1240,
        retries_used=0,
        data=[
            {"customer_name": "Acme Corp", "total": 15000},
            {"customer_name": "Globex", "total": 12500},
        ],
        inferred_chart_type="bar",
    ),
]

MOCK_QUERY_ERROR_RESPONSE = QueryErrorResponse(
    error_code="INTERNAL_SERVER_ERROR",
    error_message="Mocked failure for contract testing.",
    details={"reason": "Simulated HTTPException"},
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
        Hardcoded success response for API contract validation.
    """

    if simulate_error:
        raise HTTPException(
            status_code=500,
            detail=MOCK_QUERY_ERROR_RESPONSE.model_dump(),
        )

    return HARDCODED_QUERY_SUCCESS_RESPONSE
