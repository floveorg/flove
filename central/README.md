# flove central

Shared JS/CSS suite for flove apps. Low-code per app, not too many load calls.

## Structure

```
central/
└── libs/
    ├── routing.json     — app registry (id, url, tier, tags)
    ├── flove.js         — sound engine + summary actions + sound depth + wizard + resume
    ├── flove.css        — theme vars + toggles + wizy chips + reduced motion
    └── flove-i18n.js    — language toggle (EN/ES/FR/DE/PT)
```

## Usage in apps

```html
<link rel="stylesheet" href="libs/flove.css">
<script src="libs/flove.js" defer></script>
<script src="libs/flove-i18n.js" defer></script>
```

## Modules in flove.js

- **Sound engine** — click sounds via data-attributes, Web Audio synth
- **Summary actions** — collect/save/share data (txt, csv, xml, json, html, jpg, zip)
- **Sound depth** — Mini/Basic/Normal/Advanced/Super speech levels
- **Wizard** — bot text injection (magic/lovely/joy/wisdom)
- **Resume** — declarative resume buttons (copy, print, publish, insight cycle, magic toggle)
- **Autowire** — zero-config decoration for blogy.html

## Workflow

Gitea serves for agent development. Agents commit edits grouped by issue when meaningful for future recovery. If an agent holds edits >24h without committing, auto-commit as-is. Requests should not bump.
