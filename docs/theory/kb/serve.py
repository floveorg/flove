"""Flove KB — FastAPI Server + Web UI.

Usage:
    python serve.py
    python serve.py --port 8000
"""

import sys
from pathlib import Path

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

KB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(KB_DIR))

from retrieve import retrieve
from llm import answer as llm_answer, get_backend

app = FastAPI(title="Flove KB", description="Flore Ontology Knowledge Base")


class AnswerRequest(BaseModel):
    query: str
    top_k: int = 8
    backend: str = "openai"
    model: str | None = None


@app.get("/", response_class=HTMLResponse)
async def index():
    return HTMLResponse(content=HTML_PAGE)


@app.get("/health")
async def health():
    from pathlib import Path
    db_path = KB_DIR / "flove_kb.db"
    return {
        "status": "ok",
        "db_exists": db_path.exists(),
    }


@app.get("/api/retrieve")
async def api_retrieve(q: str = Query(..., min_length=1), top_k: int = 8, include_bipolar: bool = True):
    return retrieve(q, top_k=top_k, include_bipolar=include_bipolar)


@app.post("/api/answer")
async def api_answer(req: AnswerRequest):
    import os

    results = retrieve(req.query, top_k=req.top_k, include_bipolar=True)

    backend_kwargs = {"backend_type": req.backend}
    if req.model:
        backend_kwargs["model"] = req.model

    try:
        text = llm_answer(req.query, results["chunks"], **backend_kwargs)
        return {
            "query": req.query,
            "answer": text,
            "sources": results["chunks"][:3],
            "bipolar_pairs": results["bipolar_pairs"],
            "categories": results["detected_categories"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flove KB</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #fafafa; color: #1a1a1a; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .subtitle { color: #666; margin-bottom: 2rem; font-size: 0.9rem; }
  .search-box { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  input[type="text"] { flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
  button { padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
  button:hover { background: #1d4ed8; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .results { margin-top: 1rem; }
  .chunk { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
  .chunk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .chunk-source { font-size: 0.85rem; color: #2563eb; }
  .chunk-score { font-size: 0.8rem; color: #666; background: #f0f0f0; padding: 2px 8px; border-radius: 12px; }
  .chunk-text { font-size: 0.9rem; line-height: 1.6; color: #333; white-space: pre-wrap; }
  .bipolar-pair { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; }
  .bipolar-pair strong { color: #854d0e; }
  .answer-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; white-space: pre-wrap; line-height: 1.6; }
  .loading { text-align: center; padding: 2rem; color: #666; }
  .mode-toggle { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .mode-toggle button { font-size: 0.85rem; padding: 0.5rem 1rem; background: #e5e7eb; color: #333; }
  .mode-toggle button.active { background: #2563eb; color: white; }
  .hidden { display: none; }
</style>
</head>
<body>
<h1>Flove Knowledge Base</h1>
<p class="subtitle">Retrieval-augmented search over the Flove ontology corpus</p>

<div class="mode-toggle">
  <button id="mode-retrieve" class="active" onclick="setMode('retrieve')">Retrieve</button>
  <button id="mode-answer" onclick="setMode('answer')">Answer (LLM)</button>
</div>

<div class="search-box">
  <input type="text" id="query" placeholder="Ask about Flove concepts..." onkeydown="if(event.key==='Enter')search()">
  <button id="search-btn" onclick="search()">Search</button>
</div>

<div id="results"></div>

<script>
let currentMode = 'retrieve';

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-retrieve').classList.toggle('active', mode === 'retrieve');
  document.getElementById('mode-answer').classList.toggle('active', mode === 'answer');
  document.getElementById('query').placeholder = mode === 'answer' ? 'Ask a question...' : 'Search Flove corpus...';
}

async function search() {
  const query = document.getElementById('query').value.trim();
  if (!query) return;

  const results = document.getElementById('results');
  const btn = document.getElementById('search-btn');
  btn.disabled = true;
  results.innerHTML = '<div class="loading">Searching...</div>';

  try {
    if (currentMode === 'retrieve') {
      const res = await fetch(`/api/retrieve?q=${encodeURIComponent(query)}&top_k=8`);
      const data = await res.json();
      renderRetrieve(data);
    } else {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query, top_k: 8})
      });
      if (!res.ok) {
        const err = await res.json();
        results.innerHTML = `<div class="chunk" style="border-color:#ef4444;background:#fef2f2"><strong style="color:#dc2626">Error:</strong> ${err.detail}</div>`;
        return;
      }
      const data = await res.json();
      renderAnswer(data);
    }
  } catch (e) {
    results.innerHTML = `<div class="chunk" style="border-color:#ef4444;background:#fef2f2"><strong style="color:#dc2626">Error:</strong> ${e.message}</div>`;
  }
  btn.disabled = false;
}

function renderRetrieve(data) {
  let html = '<div class="results">';

  const cats = data.detected_categories.map(c => c.name).join(', ');
  html += `<p style="color:#666;font-size:0.85rem;margin-bottom:1rem">Categories: ${cats}</p>`;

  if (data.bipolar_pairs && data.bipolar_pairs.length > 0) {
    html += '<h3 style="margin-bottom:0.5rem;font-size:0.95rem">Bipolar Pairs</h3>';
    data.bipolar_pairs.forEach(bp => {
      html += `<div class="bipolar-pair"><strong>${escapeHtml(bp.pole_a)}</strong> &harr; <strong>${escapeHtml(bp.pole_b)}</strong>`;
      if (bp.context) html += `<br><span style="font-size:0.85rem;color:#666">${escapeHtml(bp.context)}</span>`;
      html += `<br><span style="font-size:0.8rem;color:#999">${escapeHtml(bp.citation)}</span></div>`;
    });
  }

  html += `<h3 style="margin:1rem 0 0.5rem;font-size:0.95rem">Context (${data.chunks.length})</h3>`;
  data.chunks.forEach(c => {
    html += `<div class="chunk"><div class="chunk-header"><span class="chunk-source">${escapeHtml(c.citation)} <span style="color:#999">[${escapeHtml(c.category)}]</span></span><span class="chunk-score">${c.score.toFixed(3)}</span></div><div class="chunk-text">${escapeHtml(c.text)}</div></div>`;
  });

  html += '</div>';
  document.getElementById('results').innerHTML = html;
}

function renderAnswer(data) {
  let html = '<div class="results">';
  html += `<div class="answer-box">${escapeHtml(data.answer)}</div>`;

  if (data.sources && data.sources.length > 0) {
    html += '<h3 style="margin:1rem 0 0.5rem;font-size:0.95rem">Sources</h3>';
    data.sources.forEach(c => {
      html += `<div class="chunk"><div class="chunk-header"><span class="chunk-source">${escapeHtml(c.citation)}</span></div><div class="chunk-text" style="max-height:100px;overflow:hidden">${escapeHtml(c.text)}</div></div>`;
    });
  }

  html += '</div>';
  document.getElementById('results').innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
</script>
</body>
</html>
"""


def main():
    import uvicorn
    port = 8000
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            port = int(sys.argv[i + 1])

    print(f"Starting Flove KB server on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
