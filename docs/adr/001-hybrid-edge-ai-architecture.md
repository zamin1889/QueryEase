# ADR 001: Adoption of Hybrid Edge-AI Architecture for Text-to-SQL

## Status

Accepted

## Context

QueryEase requires an LLM to translate natural language into PostgreSQL queries. The standard industry approach is to utilize third-party cloud APIs (e.g., OpenAI GPT-4, Anthropic Claude). However, QueryEase is explicitly marketed as a "Privacy-First" platform. Sending live database schemas, table names, and user queries to external cloud providers violates this core security guarantee.

## Decision

We will implement a **Hybrid Edge-AI Architecture**:

1. **Frontend / Routing:** Standard cloud/tunnel access for user interfaces.
2. **AI Inference Layer:** All LLM inference will occur on a secure, local environment utilizing Ollama.
3. **Model Selection:** We will utilize a locally fine-tuned, quantized instance of Meta Llama 3 (8B).

## Consequences

### Positive

* **Absolute Data Privacy:** Customer database schemas and queries never leave the secure tunnel. Zero data is shared with proprietary AI companies.
* **Predictable Costs:** We eliminate pay-per-token API billing. Inference costs are fixed to the local hardware overhead.

### Negative

* **Hardware Dependency:** The backend requires adequate local compute (RAM/GPU) to run the 8B parameter model performantly.
* **Maintenance Burden:** We are responsible for our own model updates, quantization, and deployment pipelines (MLOps) rather than relying on an API endpoint.
