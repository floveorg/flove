-- Flove Knowledge Base Schema
-- SQLite with FTS5 full-text search

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    path TEXT NOT NULL,
    category INTEGER,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    section TEXT,
    text TEXT NOT NULL,
    line_ref TEXT,
    category INTEGER,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS embeddings (
    chunk_id INTEGER PRIMARY KEY,
    vector BLOB NOT NULL,
    dim INTEGER NOT NULL,
    model TEXT NOT NULL,
    FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);

CREATE TABLE IF NOT EXISTS bipolar_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER,
    sheet TEXT,
    row_num INTEGER,
    pole_a TEXT,
    pole_b TEXT,
    context TEXT,
    category INTEGER,
    metadata TEXT,
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS cross_refs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_chunk_id INTEGER,
    to_chunk_id INTEGER,
    relation_type TEXT,
    note TEXT,
    FOREIGN KEY (from_chunk_id) REFERENCES chunks(id),
    FOREIGN KEY (to_chunk_id) REFERENCES chunks(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    text, section,
    content=chunks,
    content_rowid=id,
    tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
    INSERT INTO chunks_fts(rowid, text, section)
    VALUES (new.id, new.text, new.section);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
    INSERT INTO chunks_fts(chunks_fts, rowid, text, section)
    VALUES ('delete', old.id, old.text, old.section);
END;

CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
    INSERT INTO chunks_fts(chunks_fts, rowid, text, section)
    VALUES ('delete', old.id, old.text, old.section);
    INSERT INTO chunks_fts(rowid, text, section)
    VALUES (new.id, new.text, new.section);
END;

CREATE INDEX IF NOT EXISTS idx_chunks_category ON chunks(category);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_bipolar_category ON bipolar_pairs(category);
