"""Flove Knowledge Base — Ingestion Pipeline.

Parses all Flove theory sources into a SQLite database with embeddings.
"""

import sqlite3
import json
import re
import os
import sys
from pathlib import Path
from datetime import datetime

import numpy as np

KB_DIR = Path(__file__).resolve().parent
THEORY_DIR = KB_DIR.parent
DB_PATH = KB_DIR / "flove_kb.db"

CATEGORY_NAMES = {
    0: "metaphysics",
    1: "science",
    2: "biology",
    3: "linguistics",
    4: "psicosocial",
}

CHUNK_SIZE_CHARS = 1500
CHUNK_OVERLAP_CHARS = 200


def get_db(reset: bool = False) -> sqlite3.Connection:
    if reset and DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    schema = (KB_DIR / "schema.sql").read_text()
    conn.executescript(schema)
    conn.commit()
    return conn


def add_source(conn: sqlite3.Connection, name: str, source_type: str, path: str, category: int | None = None) -> int:
    cur = conn.execute(
        "INSERT INTO sources (name, source_type, path, category) VALUES (?, ?, ?, ?)",
        (name, source_type, path, category),
    )
    conn.commit()
    return cur.lastrowid


def add_chunk(conn: sqlite3.Connection, source_id: int, section: str, text: str, line_ref: str, category: int | None = None, metadata: dict | None = None) -> int:
    cur = conn.execute(
        "INSERT INTO chunks (source_id, section, text, line_ref, category, metadata) VALUES (?, ?, ?, ?, ?, ?)",
        (source_id, section, text, line_ref, category, json.dumps(metadata) if metadata else None),
    )
    conn.commit()
    return cur.lastrowid


def add_bipolar_pair(conn: sqlite3.Connection, source_id: int, sheet: str, row_num: int, pole_a: str, pole_b: str, context: str = "", category: int | None = None, metadata: dict | None = None):
    conn.execute(
        "INSERT INTO bipolar_pairs (source_id, sheet, row_num, pole_a, pole_b, context, category, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (source_id, sheet, row_num, pole_a, pole_b, context, category, json.dumps(metadata) if metadata else None),
    )
    conn.commit()


def chunk_text(text: str, max_chars: int = CHUNK_SIZE_CHARS, overlap: int = CHUNK_OVERLAP_CHARS) -> list[tuple[str, int, int]]:
    """Split text into overlapping chunks by paragraph boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""
    start_line = 0
    line_offset = 0

    for i, para in enumerate(paragraphs):
        if len(current) + len(para) > max_chars and current:
            chunks.append((current.strip(), start_line, line_offset + i))
            overlap_text = ""
            overlap_chars = 0
            for p in reversed(current.split("\n\n")):
                if overlap_chars + len(p) <= overlap:
                    overlap_text = p + "\n\n" + overlap_text
                    overlap_chars += len(p)
                else:
                    break
            current = overlap_text.strip()
            start_line = line_offset + i
        current += "\n\n" + para if current else para

    if current.strip():
        chunks.append((current.strip(), start_line, line_offset + len(paragraphs)))

    return chunks


def parse_papers(conn: sqlite3.Connection):
    """Parse the 5 synthesis papers."""
    papers_dir = THEORY_DIR / "papers"
    paper_files = sorted(papers_dir.glob("*.md"))

    for pf in paper_files:
        match = re.match(r"^(\d+)_", pf.name)
        category = int(match.group(1)) if match else None
        if category is not None and category > 4:
            category = 0

        text = pf.read_text()
        sections = re.split(r"\n##\s+", text)
        title = sections[0].split("\n")[0].replace("# ", "").strip()

        source_id = add_source(conn, pf.stem, "paper", str(pf), category)

        if sections[0].strip():
            for chunk, sl, el in chunk_text(sections[0].strip()):
                add_chunk(conn, source_id, title, chunk, "intro", category, {"source_file": pf.name})

        for section in sections[1:]:
            lines = section.split("\n", 1)
            section_title = lines[0].strip()
            section_body = lines[1] if len(lines) > 1 else ""

            if not section_body.strip():
                continue

            for chunk, sl, el in chunk_text(section_body.strip()):
                add_chunk(conn, source_id, section_title, chunk, f"section: {section_title}", category, {"source_file": pf.name})

        print(f"  Paper: {pf.name} -> category {category}")


def parse_slides(conn: sqlite3.Connection):
    """Parse slides text, splitting by form-feed boundaries."""
    slides_path = THEORY_DIR / "slides" / "Slides26.2.txt"
    if not slides_path.exists():
        print("  Slides text not found, skipping")
        return

    text = slides_path.read_text()
    slides = text.split("\x0c")

    source_id = add_source(conn, "Slides26.2", "slide", str(slides_path))

    index_patterns = [
        (0, r"METAPHYSICS"),
        (1, r"SCIENCE"),
        (2, r"BIOLOGY"),
        (3, r"LINGUISTICS"),
        (4, r"PSICOSOCIAL"),
    ]

    for idx, slide in enumerate(slides):
        if not slide.strip():
            continue

        detected_cat = None
        slide_lower = slide.lower()
        for cat_num, pattern in index_patterns:
            if re.search(pattern, slide_lower) and idx < 300:
                detected_cat = cat_num
                break

        if detected_cat is None:
            if any(w in slide_lower for w in ["teleology", "determinism", "free will", "compatibilism", "confluentism", "theology", "mathylogic", "metaphys"]):
                detected_cat = 0
            elif any(w in slide_lower for w in ["physics", "chemistry", "particle", "dimension", "force", "electron"]):
                detected_cat = 1
            elif any(w in slide_lower for w in ["cell", "organism", "biology", "evolution", "gamete", "immune", "dimorph"]):
                detected_cat = 2
            elif any(w in slide_lower for w in ["linguistics", "phonolog", "semantic", "morpholog", "prosody", "epistemolog"]):
                detected_cat = 3
            elif any(w in slide_lower for w in ["psicosocial", "psychology", "sociology", "economy", "governance", "patholog", "capitalism", "love"]):
                detected_cat = 4

        slide_text = slide.strip()
        if len(slide_text) < 20:
            continue

        slide_num = idx
        for chunk, sl, el in chunk_text(slide_text, max_chars=2000, overlap=100):
            add_chunk(conn, source_id, f"slide {slide_num}", chunk, f"slide {slide_num}", detected_cat, {"slide_number": slide_num})

    print(f"  Slides: {len([s for s in slides if s.strip()])} slides parsed")


def parse_narrations(conn: sqlite3.Connection):
    """Parse narration transcript text files."""
    narrations_dir = THEORY_DIR / "slides" / "narracion_completa_v2"
    if not narrations_dir.exists():
        print("  Narrations dir not found, skipping")
        return

    for tf in sorted(narrations_dir.glob("*.txt")):
        text = tf.read_text()
        if not text.strip():
            continue

        match = re.match(r"^(\d+)_([^.]+)", tf.name)
        section_num = int(match.group(1)) if match else None
        section_name = match.group(2).replace("_", " ").title() if match else tf.stem

        category = None
        if section_num is not None:
            cat_map = {0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: None}
            category = cat_map.get(section_num)

        source_id = add_source(conn, tf.stem, "narration", str(tf), category)

        for chunk, sl, el in chunk_text(text.strip()):
            add_chunk(conn, source_id, section_name, chunk, "narration", category, {"source_file": tf.name})

        print(f"  Narration: {tf.name} -> category {category}")


def parse_tables(conn: sqlite3.Connection):
    """Parse ODS spreadsheet tables into bipolar pairs."""
    try:
        from odf.opendocument import load
        from odf.table import Table, TableRow, TableCell
        from odf import teletype
    except ImportError:
        print("  odfpy not available, skipping tables")
        return

    tables_dir = THEORY_DIR / "tables"
    ods_files = sorted(tables_dir.glob("*.ods"))

    # Category mapping based on table content
    table_categories = {
        "Substances Confluence": 0,
        "Substances": 0,
        "Substances Confluent & Polar Values": 0,
        "Physics & Chemistry Fractality": 1,
        "Primal Systems Pairs Channels": 2,
        "Keywords 7x11": 4,
        "View Pairs Fractality & Inferences": 0,
        "Reproductive Fractality - Axial Symmetry": 2,
        "Fundamental Linguistics": 3,
        "Outers": 2,
        "Redistributive Recapitulation": 2,
        "Evolutionary Systems": 2,
        "Pairs & Intensonim 7": 3,
        "Keys 3&5": 0,
        "Gradual 7x7x7": 0,
    }

    for ods in ods_files:
        print(f"  Parsing table: {ods.name}")
        try:
            doc = load(str(ods))
            source_id = add_source(conn, ods.stem, "table", str(ods))

            spreadsheet = doc.spreadsheet
            tables = spreadsheet.getElementsByType(Table)

            for table_elem in tables:
                sheet_name = table_elem.getAttribute("name") or "unnamed"
                category = table_categories.get(sheet_name)

                row_num = 0
                for row_elem in table_elem.getElementsByType(TableRow):
                    cells = row_elem.getElementsByType(TableCell)
                    cell_texts = []
                    for cell in cells:
                        cell_texts.append(teletype.extractText(cell).strip())

                    non_empty = [c for c in cell_texts if c]
                    if len(non_empty) >= 2:
                        pole_a = non_empty[0]
                        pole_b = non_empty[1] if len(non_empty) > 1 else ""
                        context = " | ".join(non_empty[2:]) if len(non_empty) > 2 else ""

                        if pole_a.lower() in ("pole", "column", "name", "id", "#", ""):
                            row_num += 1
                            continue

                        if len(pole_a) > 1 and len(pole_b) > 1:
                            add_bipolar_pair(conn, source_id, sheet_name, row_num, pole_a, pole_b, context, category)

                    row_num += 1

            print(f"    Table {ods.name}: {len(tables)} sheets parsed")
        except Exception as e:
            print(f"    Error parsing {ods.name}: {e}")


def parse_poems(conn: sqlite3.Connection):
    """Parse the poems manifest."""
    poems_path = THEORY_DIR / "poems" / "POEMS.md"
    if not poems_path.exists():
        print("  Poems manifest not found, skipping")
        return

    text = poems_path.read_text()
    source_id = add_source(conn, "POEMS", "poem", str(poems_path))

    poem_pattern = re.compile(r"\|\s*(\S+)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|")

    category = None
    current_category_header = None

    for line in text.split("\n"):
        cat_match = re.match(r"^##\s+(\d+)\s+(\w+)", line)
        if cat_match:
            cat_num = int(cat_match.group(1))
            cat_map = {0: 0, 1: 0, 2: 1, 3: 2, 4: 3}
            category = cat_map.get(cat_num, 0)
            current_category_header = cat_match.group(2)
            continue

        m = poem_pattern.search(line)
        if m:
            track_name = m.group(1)
            track_path = m.group(2)
            concept = m.group(3).strip()

            chunk_text_content = f"Track: {track_name}\nConcept: {concept}\nPath: {track_path}"
            add_chunk(conn, source_id, current_category_header or "poem", chunk_text_content, track_name, category, {
                "track": track_name,
                "path": track_path,
                "concept": concept,
            })

    print(f"  Poems manifest parsed")


def parse_docs(conn: sqlite3.Connection):
    """Parse the top-level canonical flove docs (overview, backend, coordinates,
    puzzy, worldview, oasis, CLAUDE) and the standards/ tree. These are the
    non-theory corpus — indexed with no theory category (category=None)."""
    # The canonical docs live in apps/dev/ (the docsify "dev" app); theory (this
    # KB's THEORY_DIR) now lives separately under docs/theory/.
    docs_dir = KB_DIR.parents[2] / "apps" / "dev"  # repo_root/apps/dev
    md_files = (
        sorted(docs_dir.glob("*.md"))
        + sorted(docs_dir.glob("standards/*.md"))
        + sorted(docs_dir.glob("standards/frontend/*.md"))
    )

    for mf in md_files:
        if mf.name.startswith("_"):  # _sidebar.md, _coverpage.md, …
            continue
        text = mf.read_text()
        if not text.strip():
            continue

        rel = mf.relative_to(docs_dir)
        sections = re.split(r"\n##\s+", text)
        title = sections[0].split("\n")[0].replace("# ", "").strip() or mf.stem

        source_id = add_source(conn, str(rel), "doc", str(mf), None)

        if sections[0].strip():
            for chunk, sl, el in chunk_text(sections[0].strip()):
                add_chunk(conn, source_id, title, chunk, "intro", None, {"source_file": str(rel)})

        for section in sections[1:]:
            lines = section.split("\n", 1)
            section_title = lines[0].strip()
            section_body = lines[1] if len(lines) > 1 else ""
            if not section_body.strip():
                continue
            for chunk, sl, el in chunk_text(section_body.strip()):
                add_chunk(conn, source_id, section_title, chunk, f"section: {section_title}", None, {"source_file": str(rel)})

        print(f"  Doc: {rel}")


def generate_embeddings(conn: sqlite3.Connection):
    """Generate embeddings for all chunks using fastembed."""
    try:
        from fastembed import TextEmbedding
    except ImportError:
        print("  fastembed not available, skipping embeddings")
        return

    print("  Loading embedding model (first run downloads ~350MB)...")
    model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    model_name = "BAAI/bge-small-en-v1.5"

    rows = conn.execute("""
        SELECT c.id, c.text FROM chunks c
        LEFT JOIN embeddings e ON c.id = e.chunk_id
        WHERE e.chunk_id IS NULL
    """).fetchall()

    if not rows:
        print("  All chunks already have embeddings")
        return

    print(f"  Generating embeddings for {len(rows)} chunks...")

    batch_size = 64
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        texts = [r[1] for r in batch]
        ids = [r[0] for r in batch]

        embeddings = list(model.embed(texts))

        for chunk_id, emb in zip(ids, embeddings):
            vec_bytes = np.array(emb, dtype=np.float32).tobytes()
            dim = len(emb)
            conn.execute(
                "INSERT INTO embeddings (chunk_id, vector, dim, model) VALUES (?, ?, ?, ?)",
                (chunk_id, vec_bytes, dim, model_name),
            )

        conn.commit()
        print(f"  Embedded {min(i + batch_size, len(rows))}/{len(rows)}")

    print("  Embeddings complete")


def ingest(reset: bool = False):
    """Run full ingestion pipeline."""
    print("Flove KB Ingestion Pipeline")
    print("=" * 40)

    conn = get_db(reset=reset)

    print("\n[1/7] Parsing papers...")
    parse_papers(conn)

    print("\n[2/7] Parsing slides...")
    parse_slides(conn)

    print("\n[3/7] Parsing narrations...")
    parse_narrations(conn)

    print("\n[4/7] Parsing tables...")
    parse_tables(conn)

    print("\n[5/7] Parsing poems...")
    parse_poems(conn)

    print("\n[6/7] Parsing canonical docs (overview, backend, standards, …)...")
    parse_docs(conn)

    print("\n[7/7] Generating embeddings...")
    generate_embeddings(conn)

    stats = {
        "sources": conn.execute("SELECT COUNT(*) FROM sources").fetchone()[0],
        "chunks": conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0],
        "embeddings": conn.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0],
        "bipolar_pairs": conn.execute("SELECT COUNT(*) FROM bipolar_pairs").fetchone()[0],
    }

    print(f"\n{'=' * 40}")
    print(f"Ingestion complete:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    conn.close()
    return stats


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    ingest(reset=reset)
