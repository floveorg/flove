# ✺ XR-kit — local, offline-first toolkit for 2D → 3D/VR

A small stash of **open-source** software + reusable demos so we can turn flove
HTML interfaces into 3D/VR scenes fast, without re-fetching anything. Everything
here is local; serve over `http://localhost` (not `file://`) so WebXR and font
loading work.

## Contents

```
xr-kit/
├── lib/
│   ├── aframe.min.js      A-Frame (MIT) — the WebXR engine. Local, offline.
│   ├── troika-text.js     aframe-troika-text (self-contained UMD). Crisp 3D text
│   │                      straight from .ttf/.otf/.woff — NO MSDF pre-gen step.
│   │                      Primitive: <a-troika-text value font font-size max-width
│   │                      color anchor align>. Update at runtime via
│   │                      el.setAttribute('troika-text','value', '...').
│   ├── aframe-environment.min.js  Instant scenery by preset (sky/ground/fog/props).
│   │                      <a-entity environment="preset: dream; ...">
│   ├── aframe-layout.min.js  Auto-place children — circle/grid/line/cube. No hand
│   │                      coords. <a-entity layout="type: circle; radius: 2.4">
│   ├── aframe-extras.min.js  movement-controls, animation-mixer (glTF anims), etc.
│   ├── aframe-inspector.min.js  Visual editor, offline. Ctrl+Alt+I to move/tune.
│   ├── three/             vendored super-three 0.169 (build + HTMLMesh addon) for
│   │                      aframe-html.js, matched to A-Frame 1.6.0. Offline.
│   └── aframe-html.js      aframe-htmlmesh (AdaRoseCannon). Real HTML → 3D panel.
│                           ES module; uses lib/three via importmap (version-sensitive).
├── fonts/
│   ├── Inter.ttf          OFL — UI text
│   └── JetBrainsMono.ttf  OFL — mono / data
├── SNIPPETS.md            copy-paste recipes (text, button, layout, scenery, JSON…)
└── templates/
    ├── starter.html       BASE to copy for any new 3D/VR scene: troika text +
    │                       clickable + hover + mouse/gaze/laser/hands. Start here.
    ├── designer.html      DESIGN BENCH: environment + auto-layout + local Inspector.
    │                       Open it, press Ctrl+Alt+I, arrange visually, copy values.
    └── htmlmesh-panel.html Drop an existing HTML panel into VR (real DOM → 3D).
```

## How to use (for the assistant, on future prompts)

1. **New 3D/VR interface from scratch** → copy `templates/starter.html`, add
   entities. Text = `<a-troika-text>` reading `../fonts/*.ttf`. Buttons = an
   entity with `class="clickable"`, `data-act`, `hover-glow`, routed in the
   `app` component's click listener.
2. **Port an existing 2D HTML panel** → `templates/htmlmesh-panel.html`
   (`<a-entity html="html: #yourPanel">`). Texture-based: great for menus, not
   pixel-perfect events.
3. **Scaled input is built in**: mouse (web) → `laser-controls` (VR pads) →
   `hand-tracking-controls` → gaze cursor. No code change to scale up.
4. **Serve it**: `cd <flove root> && python3 -m http.server 8001`, then open
   `http://localhost:8001/...`. Needed for WebXR (secure origin) and fonts.

## Why these choices
- **troika over MSDF**: no pre-generation, no per-glyph atlas, reads font files
  directly, crisp at any distance, trivial runtime text updates. Fixes the
  "text invisible from file://" + "MSDF lacks glyphs" pain.
- **htmlmesh**: the most direct "my HTML, now in VR" bridge.
- All **open-source, local** — open-source-first, gift-economy, flove-clean.

## Caveats
- `aframe-html.js` imports three addons; the template uses an importmap to a CDN
  (online) and is version-sensitive. For 100% offline, vendor `three.module.js`
  + `examples/jsm/interactive/{HTMLMesh,InteractiveGroup}.js` into `lib/` and
  repoint the importmap.
- Fonts are OFL (Inter, JetBrains Mono) / their licenses live with the families
  in google/fonts; keep the OFL notice if redistributing.

## Live demo built on this kit
`../tier-index.html` — the flovy mini+basic+normal elements joined as one VR
scene (now using troika for the field text). Served at
`http://localhost:8001/apps/flovy/vr/tier-index.html`.
