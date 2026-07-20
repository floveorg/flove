# Flove KB — local semantic search over the theory pack

A small, self-contained knowledge base over `../` (the theory pack: the 5
papers, the slides text, the tables). It embeds the corpus with `fastembed`,
stores it in SQLite (`flove_kb.db`), and retrieves by semantic similarity +
bipolar-pair lookup. Optional LLM answering (OpenAI / Anthropic / Ollama).

Paths are resolved relative to this folder (`THEORY_DIR = ../`), so the whole
`theory/` tree can be moved as a unit without breaking ingestion.

## Files

- `ingest.py` — parse `../papers`, `../slides/Slides26.2.txt`, `../tables` → embeddings → SQLite.
- `retrieve.py` — semantic + bipolar retrieval.
- `llm.py` — optional answer synthesis over retrieved chunks.
- `cli.py` — command-line entry point.
- `serve.py` — FastAPI server + minimal web UI.
- `schema.sql` — DB schema.
- `flove_kb.db` — the **built index** (kept; regenerate with `--ingest --reset`).
- `requirements.txt` — Python deps.

## Setup (recreate the env; `.venv` is intentionally not stored here)

```bash
cd flove/theory/kb
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Use

```bash
# query the existing index
python cli.py "what is confluentism?"
python cli.py "simple vs complex" --mode answer --backend ollama

# rebuild the index from the theory sources
python cli.py --ingest --reset

# web UI
python serve.py --port 8000   # → http://localhost:8000
```
