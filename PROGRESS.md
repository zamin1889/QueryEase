# Software Development Life Cycle (SDLC) & Project Progress

## SDLC Methodology

We execute a continuous, iterative approach to system design consisting of four core steps applied to every new feature lifecycle:

1. Identify initial core components and data requirements.
2. Assign exact functional requirements and strict I/O contracts to those components.
3. Analyze roles and responsibilities to ensure high cohesion and loose coupling.
4. Analyze how the component affects the system's architectural characteristics (e.g., latency vs. privacy tradeoffs).

---

## Completed Development Phases

### Phase 1: Foundation & Infrastructure

- **Monorepo Initialization:** Scaffolded the decoupled frontend (React/Vite) and backend (FastAPI) environments.
- **Authentication:** Integrated Supabase Auth to establish secure, tenant-isolated user sessions.
- **UI/UX Skeleton:** Deployed Tailwind CSS and Shadcn UI components to build a modern, responsive chat interface.

### Phase 2: Database & Backend Core

- **API Routing:** Built the FastAPI skeleton with highly modularized endpoints (`/health`, `/api/v1/query`, `/api/v1/history`).
- **Dynamic Reflection:** Implemented SQLAlchemy ORM logic to perform dynamic, on-the-fly reflection of live PostgreSQL schemas (specifically targeting `global_superstore` and `spotify_tracks`).
- **Generation Logic:** Integrated Text-to-SQL logic capable of consuming dynamic DDL (Data Definition Language) and mapping user intent to specific table structures.

### Phase 3: Hybrid AI Pipeline

- **Dual-Routing System:** Engineered a toggleable provider switch to route inferences locally to an Edge model (Ollama 8B) for zero-trust privacy, or to a Cloud model (Nvidia NIM 70B) for maximum zero-shot accuracy.
- **Tunneling Configuration:** Deployed and configured a static Ngrok domain, resolving Cross-Origin Resource Sharing (CORS) intercepts using custom `ngrok-skip-browser-warning` headers.

### Phase 4: Security & Sanitization

- **Deterministic Sanitization (`sanitize_sql`):** Engineered a regex-based middleware layer that actively scans generated SQL strings prior to database execution. It deterministically blocks destructive structural mutations (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`), safely bounding the application to read-only analytical queries.
- **Self-Healing Loop:** Implemented a recursive `try...except` mechanism with a maximum retry counter (n=3) to catch execution errors and feed them back to the model for automatic correction.

### Phase 5: Auto-Visualization Engine

- **Data-to-Chart Heuristics:** Built a dynamic rendering engine in React that parses raw JSON arrays returned from the backend.
- **Responsive Components:** Integrated Recharts to auto-generate Pie Charts, Bar Charts, Area Charts, or standard data tables based purely on row counts and the detection of numeric vs. string column types.
- **Layout Hardening:** Resolved Flexbox infinite expansion bugs by enforcing strict `min-w-0` and `max-w-full` cascade rules to contain complex SVG graphics.

### Phase 6: State Management & Persistence (Chat History)

- **Database Schema:** Deployed the `chat_history` table within Supabase to log `session_id`, `user_query`, `generated_sql`, and analytical metadata.
- **Dynamic Re-execution:** Engineered the backend to re-execute historical SQL queries upon page reload, ensuring UI charts always display the freshest available database state rather than stale, hardcoded JSON.
- **Pagination:** Implemented a offset/limit pagination strategy ("Load Previous") to protect the browser's Document Object Model (DOM) from memory overload.

### Phase 7: MLOps & Evaluation Pipeline

- **Golden Datasets:** Manually constructed two 50-query baseline datasets targeting Edge Case, Medium, and Hard query scenarios for retail and audio schemas.
- **Execution-Based Evaluation (`evaluate.py`):** Built an automated testing script that compares AI-generated SQL outputs against expected SQL via strict row-count matching, accurately calculating execution success rates, semantic data accuracy, and API latency.

---

## Future Scope (Technical Debt & Enhancements)

1. **Structured JSON LLM Output:** Upgrade the backend prompting engine to enforce strict JSON responses (e.g., `{"sql": "...", "chart_type": "bar", "x_axis": "genre"}`). This will deprecate the frontend data-guessing heuristic, making visual mapping 100% deterministic.
2. **Isolated Chat Sessions:** Refactor the single paginated timeline into a threaded "Sidebar" model (e.g., specific sessions for "Sales Analysis" vs "Music Trends") using unique UUID session foreign keys.
3. **Production Deployment:** Migrate the frontend to a Vercel Edge Network and deploy the FastAPI backend to a managed container service (Render/Railway), permanently deprecating the Ngrok dependency.
