# apps/index.html — redesign round (2026-06-19)

Seven scoped changes to `apps/index.html` (the demos index). Interview:
`docs/talk2web-apps-index-2026-06-19.html`.

## Decisions

1. **Custom button (top nav).** Replace the 🙂 `cat-emo` label with a red **Custom**
   button matching the entrance band's red. Keeps its behaviour: toggles the
   5-feeling filter row (`#emo-tog` → `.emo-row`).

2. **Remove plants & nature.** Delete markup + CSS for both gardens:
   - `.topbar-garden` (water + `.topbar-plant`s) markup, and CSS `.topbar-garden`,
     `.topbar-plant*`, `@keyframes tplant-grow`, topbar-water rules.
   - `.garden` (`.garden-stem`, `.garden-worm`, `.butterfly`) markup, and CSS
     `.garden*`, `@keyframes leaf-pop`, worm/butterfly rules.
   - Keep `.brand-leaf` (brand mark, not a background effect).

3. **"See docs" anchors.** Remap broken Spanish ids to the real `docs/index.html`
   section anchors:
   `#metafisica→#metaphysics`, `#ciencia→#science`, `#biologia→#biology`,
   `#lenguajes→#language`, `#psico→#psycosocial`, `#social→#ecosystem`,
   `#economia→#economy`.

4. **Slide 1 = bigger logo.** In each modal's `.cube-shots`, the first `.shot`
   shows the app's `flove-mark` (`<use href="#mark-…">`) enlarged, replacing the
   lone emoji. New CSS so an SVG mark fills the first shot.

5. **Slide 2 = live landing-page preview.** Second `.shot` becomes a scaled,
   non-interactive `<iframe loading="lazy">` of the app's real page (same href as
   the modal's ▶ Play button). Apps without a standalone page keep a placeholder.

6. **Top-nav cleanup.** Remove **Know more** (`flow-know`) and **Keys**
   (`cat-keys`) from the grid-view `.cats` nav. Move the violet **All**
   (`flow-all`) from the front of the row to **after Economy**.

7. **Collapsible category row.** Pure-CSS chevron **▸/▾** toggle (hidden checkbox
   + label) at the front of the `.cats` row. **Expanded by default.** When
   collapsed it hides **all** the filter buttons in that row (Custom, Inside,
   Mating, Words, Social, Economy, All) — only the chevron remains.

## Verification
- Rasterize/inspect the changed visual regions (Custom button red, logo slide,
  collapse states) before committing — do not iterate blind.
- Then commit + push `apps/index.html` to flove Gitea (`marc/flove`, main).
- Record the interview into `making-of.html`, regen feeds, commit + push.
