# keys · mini — design spec

**Date:** 2026-06-17
**Scope:** a brand-new file `apps/puzzy/keysmini.html`. `keys.html` (the *advanced* tier) is **not touched**.
**Status:** approved design; ready for implementation plan.

## 1. Purpose & context

`keys.html` is the **advanced** tier of the Keys app (a full JS app: drag-to-order
decks, stages, analyze/perspectives/combos, summary, export, bilingual i18n).

This spec defines **keys · mini**, the smallest real tier in the flove tier model
(mini → basic → normal → advanced → super; a still-smaller *nano* may follow).
Per the tier model, **mini = pure CSS, 0 JavaScript**. It mirrors the established
`apps/blogy/blogymini.html` pattern (1,225 lines, zero `<script>`).

The mini reduces Keys to its essence — ranking a few small groups of ideas — with
the absolute minimum of features.

## 2. Goals / non-goals

**Goals**
- A self-contained, pure-CSS, **zero-JS** file.
- The core Keys gesture, reduced: rank each group's three cards **1·2·3**.
- Bilingual EN/ES via a pure-CSS toggle.
- Visual identity consistent with Keys (logo, palette).

**Non-goals (explicitly out of scope)** — deferred to other tiers / nano:
recap/summary, "why" field, tier-pop navigation widget, onboarding, stages,
analyze / perspectives / combos, export / share / publish, panda, sounds,
persistence/saving, and the basic / normal / nano tiers themselves.

## 3. Decisions (locked)

| Decision | Choice |
|---|---|
| File | new `apps/puzzy/keysmini.html`; `keys.html` untouched |
| JS | none — pure CSS |
| Content | the 3 default triads only |
| Core interaction | per-card **1·2·3** rank radios, **highlight only** (no reorder, no uniqueness enforcement) |
| Language | **bilingual EN/ES**, pure-CSS span toggle, one file |
| Recap / why / nav / onboarding | **excluded** |

### Content (hardcoded, bilingual — from `keys.html` `DECKS.itemsI18n`)
- **Philosophy / Filosofía** — Joy/Alegría · Love/Amor · Wisdom/Sabiduría
- **Psicosocial / Psicosocial** — Local · Personal · Social
- **Service / Servicio** — Gift/Regalo · Lend/Prestar · Exchange/Intercambio

## 4. Architecture

One self-contained HTML file. Inline `<style>`, inline logo SVG. Only external
reference is `<link rel="icon" href="favicon-keys.svg">`. Estimated ~250–350 lines.
Works offline / `file://`.

Body, top → bottom:
1. Hidden `#lang-es` checkbox — the bilingual engine (first element in `<body>`).
2. **Topbar** — Keys logo (the ellipses-flower SVG, same as `keys.html`/favicon) +
   title + a language toggle `<label for="lang-es">` (🌐 / flag).
3. **Intro line** (bilingual) — one sentence: "Rank each group's three cards 1·2·3."
4. **Three groups**, each = bilingual title + three cards.
5. Nothing else.

## 5. Components (small, independent units)

- **Language engine** — `#lang-es` checkbox + two CSS rules. Every user-visible
  string is `<span class="en">…</span><span class="es">…</span>`. Default hides
  `.es`; `body:has(#lang-es:checked)` hides `.en`. A labelled toggle flips it.
  *Depends on:* nothing. *Interface:* wrap strings in `.en`/`.es` spans.
- **Group** — titled container of 3 cards. *Interface:* a title + 3 cards.
- **Card** — the word (bilingual) + a rank control. *Interface:* word + rank control.
- **Rank control** — 3 radios `name="g{n}c{m}"`, ids `g{n}c{m}-1/2/3`, with three
  number `<label>`s (`1 2 3`). `:checked` highlights the chosen number. Ephemeral
  (no persistence). *Depends on:* nothing.

## 6. No-JS mechanics

- **Ranking** — per card, a radio group of three (`1/2/3`); the checked radio's
  label is highlighted via `input:checked + label` / `:has()`. State is ephemeral
  (acceptable for a mini). No physical card reordering; no uniqueness enforcement
  (pure CSS cannot guarantee a permutation — two cards may share a number; this is
  a personal ranking aid, not a scored mechanic).
- **Language** — `#lang-es` checkbox drives `.en`/`.es` span visibility; the topbar
  toggle is a `<label for="lang-es">`.

## 7. Error handling / edge cases

- No JS ⇒ no runtime errors possible.
- No save — expected for the mini tier.
- Offline / `file://` safe (self-contained; inline logo).
- Accessibility — real `<input>` radios with `<label>`s; the language toggle is a
  labelled checkbox; semantic headings for groups.
- Reduced-motion — no animation (or trivially gated).

## 8. Look & standards

flove dark palette with violet/pink/gold accents, consistent with the Keys
identity; reuse the Keys ellipses-flower logo. Mirror `blogymini`'s structural
conventions (topbar, container widths, type scale).

## 9. Implementation approach

Author the file fresh from this spec + the `blogymini` pattern (a focused subagent
can generate it). **`keys.html` is not touched.** After authoring:
- verify zero `<script>` (grep) and HTML well-formedness;
- the user opens it in a browser to confirm the 1·2·3 highlight and EN/ES toggle;
- commit `apps/puzzy/keysmini.html` to Gitea per the flove workflow.

## 10. Verification checklist

- [ ] `grep -c "<script" keysmini.html` → `0`
- [ ] HTML parses (well-formed)
- [ ] 3 groups × 3 cards render with 1·2·3 controls
- [ ] clicking a number highlights it (per card)
- [ ] language toggle flips all strings EN↔ES
- [ ] favicon + logo are the Keys flower
- [ ] no external assets beyond the favicon link
