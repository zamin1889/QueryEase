# QueryEase 🧠⚡

**QueryEase** is an Agentic Text-to-SQL SaaS platform that allows users to interact with their PostgreSQL databases using natural language. By leveraging a hybrid Llama 3 architecture, QueryEase safely translates plain English into optimized SQL queries, executes them against the database, and returns actionable data.

## 🏗️ Architecture & Tech Stack

This project is built as a monorepo containing a decoupled frontend and backend.

* **Frontend:** React (Vite) + Tailwind CSS + Shadcn UI
* **Backend:** Python (FastAPI)
* **Database:** Supabase (PostgreSQL)
* **AI Engine:** Llama 3 (Hybrid Inference Approach)

## ✨ Core Features

* **Agentic Text-to-SQL:** Understands user intent, fetches database schemas, and generates accurate SQL queries using Llama 3.
* **Secure Execution:** Safely executes read-only (or sandboxed) queries against a Supabase PostgreSQL instance.
* **Hybrid AI Pipeline:** Optimized routing for LLM inference ensuring speed, accuracy, and data privacy.
* **Modern UI/UX:** Responsive, chat-driven interface built with React and Tailwind CSS.

## 📂 Project Structure


QueryEase/\
├── backend/       # FastAPI server, AI agents, database connectors \
├── frontend/      # Vite + React web application \
├── README.md      # Project documentation \
└── .gitignore     # Git ignore rules 


## 🚀 Getting Started (Development)

### Prerequisites
* Python 3.10+
* Node.js 18+
* A Supabase account and project
* Access to Llama 3 (via local Ollama, Groq, or cloud API)

*(Detailed setup instructions for both backend and frontend will be added here as development progresses).*
