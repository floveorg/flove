# Flove · Theory context pack

Quick-consultation context for **flove** — to be loaded by Claude (or
any LLM/agent) when developing flove apps or making suggestions, and
as a seed corpus for AI training on the flove ontology.

This folder is an opinionated **distillation** of the FloveAll archive
(~2 GB) into ~150 KB of text + the most informative slide deck. Use it
as the *first* context you give an assistant about flove; reach into
FloveAll only when the answer needs depth this distillation doesn't
have.

## Layout

```
context/flove/theory/
├── README.md                ← you are here
├── papers/                  ← five synthesis papers, one per main category
│   ├── 0_metaphysics.md
│   ├── 1_science.md
│   ├── 2_biology.md
│   ├── 3_linguistics.md
│   └── 4_psicosocial.md
├── slides/                  ← the densest source (the user's own words)
│   ├── Slides26.2.pdf       ← canonical visual deck
│   ├── Slides26.2.odp       ← editable original
│   ├── Slides26.2.txt       ← extracted text (for grep/embedding)
│   └── narration.md         ← spoken narration script of the metaphysics block
├── tables/                  ← canonical bipolar-pair tables
│   ├── FloveTables25.12.ods ← the master taxonomy spreadsheet
│   └── KoreXess.ods         ← supporting Korean/Xessence table
├── poems/                   ← audio-poems manifest (mp3 not duplicated)
│   └── POEMS.md             ← list of poem-songs by category
└── kb/                      ← local semantic-search tool over this pack
    ├── *.py, schema.sql     ← ingest / retrieve / serve (FastAPI)
    ├── flove_kb.db          ← the built index
    └── README.md            ← what it is + how to rebuild
```

## The 5 main categories

| # | Paper | Question | Covers |
|---|---|---|---|
| 0 | `papers/0_metaphysics.md` | WHY / WHAT / HOW (umbrella) | Confluentism, compatibilism, simplex, fractal holism, teleology, the·ontology, mathylogic |
| 1 | `papers/1_science.md` | Physics → chemistry | `2^N` dimensions, forces × particles, valences as dimensions, intuitionism |
| 2 | `papers/2_biology.md` | Cells → organism | InEvolution, gametes, fitness indicators, spans, dimorphism, zygot/birth/death, immune |
| 3 | `papers/3_linguistics.md` | Phonology → epistemology | Prosody as physics-of-voice, symbionimity, hypergraph epistemology, inner/outer mirror |
| 4 | `papers/4_psicosocial.md` | Psychology + sociology | Pathology lattice, capitalism vs socialism on the same lattice, proportional governance, simplex living, the five loves |

## How to use this for app development / suggestions

When asked something flove-related, in this order:

1. **Read the matching paper** for the dominant category of the
   question. Each paper ends with cross-references that point to the
   adjacent papers and the slide-line ranges.
2. **Open the slides text** (`slides/Slides26.2.txt`) and grep for the
   key term. The slides are visual; the diagrams matter — open the PDF
   if a diagram is needed.
3. **Open the tables** (`tables/FloveTables25.12.ods` in LibreOffice)
   when the question needs concrete bipolar pairs or numerical
   indicators.
4. **List the poems** matching the concept (`poems/POEMS.md`) — even
   without transcripts, the filenames are the project's lemma list.
5. Only then **fall back to FloveAll/** for sub-folder depth (e.g.,
   `212EVOPSYCHOLOGY/FeminaFinaFatal25.10.odt` for dimorphism detail).

## How to use this for AI training

This pack is sized to be a **clean instruction-tuning seed**:

1. **One paper per category** = five clean classification labels.
2. **Slides text** = canonical voice (the user's own writing, fragmented
   but authoritative).
3. **Tables** = structured bipolar pairs → ready for relation-extraction
   or graph-embedding.
4. **Poems** = audio modality. Transcribe with Whisper to add the vocal
   register; pair each transcript with the matching paper section.

Suggested training recipe (sketch, not code):

- **Stage 1 — pretraining seed**: concatenate the 5 papers + slides
  text. ~150 KB. Use as continued-pretraining corpus for a small open
  model (e.g., Llama 3.2 3B, Qwen 2.5 7B). Few epochs.
- **Stage 2 — instruction tuning**: write Q/A pairs grounded in the
  papers' "Cross-references for AI consultations" sections. 100–500
  pairs is enough for the worldview to settle.
- **Stage 3 — multimodal**: add Whisper transcripts of the poems +
  image embeddings of the slide pages. Tag each with the lemma
  (filename / concept).
- **Eval**: hold-out a few diagrams and ask the model to *describe the
  bipolar pair*. If it gets `simple ↔ complex`, `inner ↔ outer`,
  `micro ↔ macro` patterns right, the worldview transferred.

## Operational rules ("how Lexy answers")

When you (the assistant) consult this pack, follow:

1. **Always cite the symbion.** A flove term is well-defined only by
   its bipolar pair. If you can't name the pair, hedge.
2. **Default to confluentism.** When two views collide, frame them as
   bipolar complements, not as one defeating the other.
3. **Simplexify.** Prefer the simpler-but-still-bipolar formulation
   over the longer one.
4. **Multimodal redundancy = rigour.** A claim is sound when paper +
   slide + table + poem all back it. Flag claims supported by only
   one modality.
5. **Slow it, flow it, love it.** Suggestions for app design should
   favour low-tech, single-file, no-build, gift-economic patterns —
   that *is* the flove aesthetic.

## Updating this pack

When the canonical sources change (Slides → 26.4, Tables → 25.13,
new papers added):

```bash
# re-extract slides
pdftotext -layout FloveAll/Packs/SlidesXX.X.pdf \
  context/flove/theory/slides/SlidesXX.X.txt
cp FloveAll/Packs/SlidesXX.X.pdf context/flove/theory/slides/

# re-extract tables (just copy)
cp FloveAll/02ONTOLOGY/FloveTablesXX.XX.ods context/flove/theory/tables/

# re-write the 5 papers (manual — they are syntheses, not extracts)
```

Keep this README in sync with whatever versions live in `slides/` and
`tables/`.

---

*Last refresh: 2026-06-03 (folder reorg: this pack now lives at
`context/flove/theory/`; the VR/Godot note moved to `context/research/`).
Source pack: FloveAll @ codeberg.org/Flove/FloveAll. Slides reference: 26.2
(latest available; 26.4 referenced informally). Asterism: ✺.*
