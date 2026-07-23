# Plan: Docs

> Decisions: D02 (cross-links), D05 (search), D06 (theme), D09 (examples),
> D10 (navigation), D13 (contributing), D14 (support), D20 (maintenance),
> D21 (audience), D22 (versioning), D23 (footer).

## Decisions made

| Topic | Decision |
|-------|----------|
| Cross-links | None — each page standalone |
| Search | None — just navigation |
| Theme | Standard toggle of day/night |
| Code examples | None |
| Navigation | Top nav bar, standardize existing |
| Contributing | Yes, contribution guide |
| Support | Both (email + GitHub) |
| Maintenance | Scheduled reviews (quarterly) |
| Audience | All equally (no primary) |
| Versioning | Version per release |
| Footer | No footer for now |

## Architecture

### Navigation
- Standardize existing top nav bar across all doc pages
- No sidebar, no search — navigation IS the discovery mechanism
- Nav links: contract, frontend, standards index, plans, pendings

### Theme
- apps/index.html keeps its own pattern (K05)
- Shared toggle: flips variant (dark→light, light→dark) (K06)
- System default + override via localStorage (K07)
- JS-controlled fade transition (K08)

### Contributing
- New page: `docs/contributing.html`
- Sections: how to contribute, structure, style guide, PR process
- Linked from top nav

### Support
- Footer on docs pages (when footer is added): email + GitHub Issues
- For now: just GitHub Issues link in nav

### Maintenance
- Quarterly review cycle
- Checklist: links valid, examples current, versions correct

### Versioning
- Each release gets a snapshot of docs
- Version number in page title or meta
- Old versions archived (not linked from nav)

## Tasks

1. Standardize top nav across all `docs/*.html` pages
2. Wire shared theme toggle to docs pages
3. Create `docs/contributing.html`
4. Add support link to nav
5. Implement quarterly review checklist (docs/maintenance.md)
6. Add version snapshot mechanism

## Conflicts

- None currently
