"""Flove Knowledge Base — Hybrid Retrieval Engine.

Follows Flove methodology: papers first, then slides, tables, poems.
Combines FTS5, vector similarity, and category-aware ranking.
"""

import sqlite3
import json
import re
from pathlib import Path
from dataclasses import dataclass, field

import numpy as np

KB_DIR = Path(__file__).resolve().parent
DB_PATH = KB_DIR / "flove_kb.db"

CATEGORY_KEYWORDS = {
    0: ["teleology", "determinism", "free will", "compatibilism", "confluentism",
        "god", "theology", "metaphys", "ontology", "mathylogic", "intuitionism",
        "simplex", "fractal", "holism", "why", "purpose", "intent", "fate",
        "meaning", "will", "belief", "pantheism", "atheism", "monotheism",
        "deterministic", "antideterminism", "rupture", "continuum"],
    1: ["physics", "chemistry", "particle", "dimension", "force", "boson",
        "fermion", "electron", "quarck", "quark", "valence", "atom", "molecule",
        "gravity", "electromagnet", "nuclear", "spacetime", "quantum",
        "photon", "gluon", "higgs", "lepton", "nucleon"],
    2: ["biology", "cell", "organism", "evolution", "gamete", "zygot",
        "embryo", "immune", "dimorph", "matrifocal", "patrilateral",
        "tissue", "organ", "species", "fitness", "span", "recapitulation",
        "cytoplasm", "microbe", "mammal", "reproductive"],
    3: ["linguistics", "phonolog", "semantic", "morpholog", "prosody",
        "epistemolog", "phoneme", "syllable", "inner mirror", "outer mirror",
        "symbionimity", "hypergraph"],
    4: ["psicosocial", "psycholog", "sociolog", "economy", "governance",
        "patholog", "capitalism", "socialism", "narcissism", "egolatry",
        "love", "gift", "proportional", "trauma", "bipolar disorder",
        "five loves", "hypergamy", "paedophilia", "schizo"],
}

CATEGORY_NAMES = {
    0: "Metaphysics",
    1: "Science",
    2: "Biology",
    3: "Linguistics",
    4: "PsicoSocial",
}


@dataclass
class RetrievalResult:
    chunk_id: int
    text: str
    section: str
    source: str
    source_type: str
    category: int | None
    line_ref: str
    score: float
    metadata: dict = field(default_factory=dict)

    @property
    def category_name(self) -> str:
        return CATEGORY_NAMES.get(self.category, "General") if self.category is not None else "General"

    @property
    def citation(self) -> str:
        parts = [self.source]
        if self.section:
            parts.append(self.section)
        if self.line_ref:
            parts.append(self.line_ref)
        return " / ".join(parts)


@dataclass
class BipolarResult:
    pole_a: str
    pole_b: str
    context: str
    source: str
    sheet: str
    category: int | None

    @property
    def citation(self) -> str:
        parts = [self.source]
        if self.sheet:
            parts.append(self.sheet)
        return " / ".join(parts)


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def detect_categories(query: str) -> list[int]:
    """Detect which Flove categories are relevant to a query."""
    query_lower = query.lower()
    scores = {}

    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in query_lower:
                score += len(kw)
        if score > 0:
            scores[cat] = score

    if not scores:
        return [0, 1, 2, 3, 4]

    max_score = max(scores.values())
    threshold = max(max_score * 0.3, 1)
    return sorted([cat for cat, s in scores.items() if s >= threshold], key=lambda c: -scores[c])


def fts_search(conn: sqlite3.Connection, query: str, category: int | None = None, limit: int = 10) -> list[RetrievalResult]:
    """Full-text search using FTS5."""
    safe_query = re.sub(r'[^\w\s]', ' ', query).strip()
    terms = safe_query.split()

    if len(terms) > 1:
        # Use phrase matching for multi-word queries, plus individual terms
        search_expr = " OR ".join(terms)
    else:
        search_expr = safe_query

    cat_filter = "AND c.category = ?" if category is not None else ""
    cat_param = (category,) if category is not None else ()

    sql = f"""
        SELECT c.id, c.text, c.section, c.line_ref, c.category, c.metadata,
               s.name as source, s.source_type,
               rank as fts_rank
        FROM chunks_fts
        JOIN chunks c ON chunks_fts.rowid = c.id
        JOIN sources s ON c.source_id = s.id
        WHERE chunks_fts MATCH ? {cat_filter}
        ORDER BY rank
        LIMIT ?
    """

    try:
        rows = conn.execute(sql, (search_expr, *cat_param, limit)).fetchall()
    except Exception:
        # Fallback: try simple term search
        try:
            rows = conn.execute(sql, (terms[0] if terms else query, *cat_param, limit)).fetchall()
        except Exception:
            return []

    results = []
    for r in rows:
        results.append(RetrievalResult(
            chunk_id=r["id"],
            text=r["text"],
            section=r["section"],
            source=r["source"],
            source_type=r["source_type"],
            category=r["category"],
            line_ref=r["line_ref"],
            score=1.0 / (1.0 + abs(r["fts_rank"])),
            metadata=json.loads(r["metadata"]) if r["metadata"] else {},
        ))
    return results


def vector_search(conn: sqlite3.Connection, query: str, category: int | None = None, limit: int = 10) -> list[RetrievalResult]:
    """Vector similarity search using stored embeddings."""
    try:
        from fastembed import TextEmbedding
    except ImportError:
        return []

    # Check if there are any embeddings
    emb_count = conn.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0]
    if emb_count == 0:
        return []

    try:
        model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    except Exception:
        return []

    query_emb = np.array(list(model.embed([query]))[0], dtype=np.float32)

    cat_filter = "AND c.category = ?" if category is not None else ""
    cat_param = (category,) if category is not None else ()

    rows = conn.execute(f"""
        SELECT e.chunk_id, e.vector, e.dim,
               c.text, c.section, c.line_ref, c.category, c.metadata,
               s.name as source, s.source_type
        FROM embeddings e
        JOIN chunks c ON e.chunk_id = c.id
        JOIN sources s ON c.source_id = s.id
        WHERE 1=1 {cat_filter}
    """, cat_param).fetchall()

    if not rows:
        return []

    results = []
    for r in rows:
        vec = np.frombuffer(r["vector"], dtype=np.float32)
        if len(vec) != len(query_emb):
            continue
        dot = np.dot(query_emb, vec)
        norm_q = np.linalg.norm(query_emb)
        norm_v = np.linalg.norm(vec)
        if norm_q == 0 or norm_v == 0:
            sim = 0.0
        else:
            sim = float(dot / (norm_q * norm_v))

        results.append((sim, RetrievalResult(
            chunk_id=r["chunk_id"],
            text=r["text"],
            section=r["section"],
            source=r["source"],
            source_type=r["source_type"],
            category=r["category"],
            line_ref=r["line_ref"],
            score=sim,
            metadata=json.loads(r["metadata"]) if r["metadata"] else {},
        )))

    results.sort(key=lambda x: -x[0])
    return [r for _, r in results[:limit]]


def search_bipolar_pairs(conn: sqlite3.Connection, query: str, category: int | None = None, limit: int = 5) -> list[BipolarResult]:
    """Search bipolar pairs tables."""
    safe_query = re.sub(r'[^\w\s]', ' ', query)
    terms = safe_query.strip().split()

    conditions = []
    params = []
    for term in terms:
        conditions.append("(bp.pole_a LIKE ? OR bp.pole_b LIKE ? OR bp.context LIKE ?)")
        params.extend([f"%{term}%", f"%{term}%", f"%{term}%"])

    where = " AND ".join(conditions) if conditions else "1=1"
    cat_filter = "AND bp.category = ?" if category is not None else ""
    if category is not None:
        params.append(category)

    sql = f"""
        SELECT bp.pole_a, bp.pole_b, bp.context, bp.sheet, bp.category,
               s.name as source
        FROM bipolar_pairs bp
        JOIN sources s ON bp.source_id = s.id
        WHERE {where} {cat_filter}
        LIMIT ?
    """

    rows = conn.execute(sql, (*params, limit)).fetchall()

    return [BipolarResult(
        pole_a=r["pole_a"],
        pole_b=r["pole_b"],
        context=r["context"],
        source=r["source"],
        sheet=r["sheet"],
        category=r["category"],
    ) for r in rows]


def retrieve(query: str, top_k: int = 8, include_bipolar: bool = True) -> dict:
    """Main retrieval function following Flove methodology."""
    conn = get_db()

    categories = detect_categories(query)

    all_results = []
    seen_ids = set()

    # Step 1: General FTS search (broadest match)
    general_results = fts_search(conn, query, limit=top_k)
    for r in general_results:
        if r.source_type == "paper":
            r.score *= 1.5  # Boost paper results
        seen_ids.add(r.chunk_id)
        all_results.append(r)

    # Step 2: Category-specific FTS (for detected categories)
    for cat in categories:
        cat_results = fts_search(conn, query, category=cat, limit=top_k // 2)
        for r in cat_results:
            if r.chunk_id not in seen_ids:
                if r.source_type == "paper":
                    r.score *= 1.5
                seen_ids.add(r.chunk_id)
                all_results.append(r)

    # Step 3: Vector search (if embeddings exist)
    vec_results = vector_search(conn, query, limit=top_k // 2)
    for r in vec_results:
        if r.chunk_id not in seen_ids:
            seen_ids.add(r.chunk_id)
            all_results.append(r)

    # Sort by score
    all_results.sort(key=lambda r: -r.score)
    all_results = all_results[:top_k]

    # Step 4: Bipolar pairs
    bipolar_results = []
    if include_bipolar:
        for cat in categories:
            bp_results = search_bipolar_pairs(conn, query, category=cat, limit=3)
            bipolar_results.extend(bp_results)
        if not bipolar_results:
            bipolar_results = search_bipolar_pairs(conn, query, limit=5)

    conn.close()

    return {
        "query": query,
        "detected_categories": [{"id": c, "name": CATEGORY_NAMES.get(c, "General")} for c in categories],
        "chunks": [
            {
                "id": r.chunk_id,
                "text": r.text,
                "section": r.section,
                "source": r.source,
                "source_type": r.source_type,
                "category": r.category_name,
                "category_id": r.category,
                "line_ref": r.line_ref,
                "score": round(r.score, 4),
                "citation": r.citation,
                "metadata": r.metadata,
            }
            for r in all_results
        ],
        "bipolar_pairs": [
            {
                "pole_a": bp.pole_a,
                "pole_b": bp.pole_b,
                "context": bp.context,
                "source": bp.source,
                "sheet": bp.sheet,
                "category": CATEGORY_NAMES.get(bp.category, "General") if bp.category is not None else "General",
                "citation": bp.citation,
            }
            for bp in bipolar_results
        ],
    }


if __name__ == "__main__":
    import sys
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What is confluentism?"
    results = retrieve(query)

    print(f"Query: {results['query']}")
    print(f"Categories: {', '.join(c['name'] for c in results['detected_categories'])}")
    print(f"\n--- Chunks ({len(results['chunks'])}) ---")
    for i, chunk in enumerate(results["chunks"], 1):
        print(f"\n{i}. [{chunk['category']}] {chunk['citation']} (score: {chunk['score']})")
        print(f"   {chunk['text'][:200]}...")

    if results["bipolar_pairs"]:
        print(f"\n--- Bipolar Pairs ({len(results['bipolar_pairs'])}) ---")
        for i, bp in enumerate(results["bipolar_pairs"], 1):
            print(f"\n{i}. {bp['pole_a']} <-> {bp['pole_b']}")
            if bp["context"]:
                print(f"   Context: {bp['context'][:150]}")
            print(f"   Source: {bp['citation']}")
