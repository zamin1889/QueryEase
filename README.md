# QueryEase

**QueryEase** is a privacy-first, Agentic Text-to-SQL SaaS platform. It enables non-technical users to interact with massive PostgreSQL databases using standard natural language. By utilizing a hybrid LLM architecture, QueryEase translates plain English into optimized, sanitized SQL queries, executes them against live infrastructure, and returns actionable data visualizations.

## Architecture & Tech Stack

This project is engineered as a highly decoupled monorepo.

* **Frontend Environment:** React (Vite), Tailwind CSS, Shadcn UI, Recharts (Data Visualization)
* **Backend Environment:** Python (FastAPI), Uvicorn, SQLAlchemy
* **Database Infrastructure:** Supabase (PostgreSQL)
* **AI Engine:** Dual-routing system supporting Local Edge Models (Ollama) and external Cloud APIs (Nvidia NIM).

## Core Features

* **Agentic Schema Reflection:** The backend dynamically reads and understands live database schemas, requiring zero hardcoding when tables or columns change.
* **Hybrid AI Pipeline:** Optimized toggle for LLM inference. Users can select "Cloud" for high-speed, complex reasoning or "Edge" for zero-trust data privacy running entirely on local hardware.
* **Secure Execution Sandbox:** An aggressive middleware layer safely sanitizes all generated code, blocking destructive operations (`DROP`, `DELETE`, etc.) before they hit the database.
* **Auto-Visualization:** The frontend heuristically analyzes the structure of incoming data arrays and automatically renders the optimal chart type (Pie, Bar, Area, or Table).
* **Persistent Chat History:** Seamless session resumption powered by dynamic SQL re-execution and chunked data pagination.

## MLOps Benchmark: Cloud vs. Edge

We evaluated QueryEase on a 50-query golden dataset utilizing a "Zero-Shot Multi-Table Schema Resolution" test. Both the target tables (`global_superstore`, `spotify_tracks`) and the system tables (`chat_history`) were left active simultaneously to test the AI's ability to semantically route the prompt to the correct target without confusion.

| AI Engine (Parameters) | Target Dataset | Execution Success | Data Accuracy | Avg. Latency | Self-Healing Retries |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nvidia NIM (70B)** | Superstore | 74.0% | 70.0% | 9.83s | 0.48 |
| **Local Edge (8B)** | Superstore | 78.0% | 62.0% | 46.47s | 0.10 |
| **Nvidia NIM (70B)** | Spotify | 96.0% | 90.0% | 10.62s | 0.34 |
| **Local Edge (8B)** | Spotify | 74.0% | 66.0% | 39.01s | 0.08 |

**Key Findings:** 1. **Cloud Architectures (70B)** excel at complex semantic routing and schema isolation but are highly vulnerable to API Rate Limits (429 errors), which accounted for 100% of their failures.
2. **Edge Architectures (8B)** guarantee absolute data privacy and immunity from network rate limits. However, smaller parameter context windows require strict schema pruning to prevent cross-join hallucinations (e.g., the AI attempting to artificially join the Superstore and Spotify datasets together). Local processing also traded off ~30 seconds of latency per query compared to the cloud.

## Project Structure

```text
QueryEase/
├── backend/       # FastAPI server, SQLAlchemy connectors, evaluation scripts
├── frontend/      # Vite + React web application, Tailwind config
├── README.md      # Platform overview and metrics
├── ARCHITECTURE.md# System design and dataflow documentation
├── PROGRESS.md    # SDLC lifecycle and future roadmap
└── requirements.txt
