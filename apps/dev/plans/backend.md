# Plan: Backend

> Decisions: DEP01-DEP10 + L01-L03 + L07-L10 + JSON distro specifics.
> L04 (API), L05 (CORS), L06 (rate limit) still pending.

## Decisions made

| Topic | Decision |
|-------|----------|
| Hosting | Hybrid (local dev + cloud prod, GitHub) |
| Auth | OAuth (GitHub/Google) — "in this version" |
| Database | JSON files — "in this version" |
| API | **pending** (L04) |
| CORS | **pending** (L05) — but routing.json is same-origin, no CORS needed |
| Rate limiting | **pending** (L06) |
| Logging | Structured JSON logs — "in this version" |
| Backups | Automated (cron) |
| Deployment | CI/CD (GitHub Actions) |
| Initial scope | Minimal (routing.json + metadata) |

## JSON Distro Architecture

### Routing schema
```json
{
  "version": "1.0",
  "lastUpdated": "26-07",
  "apps": [
    {
      "id": "blogy",
      "name": "Blogy",
      "url": "apps/blogy/blogy.html",
      "tier": "basic",
      "description": "A blog app for flove",
      "tags": ["social", "writing"]
    }
  ]
}
```

### App discovery
- Flat scan: `apps/*/[name].html`
- App ID = filename without extension
- Tier from `<meta name="tier" content="basic">`
- Description from `<meta name="description" content="...">`
- Tags from `<meta name="tags" content='["social","writing"]'>`

### Valid tier values
`nano · mini · basic · normal · advanced · super · mega`

### Build pipeline
1. Scan `apps/*/[name].html` for meta tags
2. Extract: id (filename), name (title), url (relative path), tier, description, tags
3. Validate required fields (id, name, url, tier) — interactive prompt if invalid (I05)
4. Auto-generate `lastUpdated` in yy-mm format
5. Write `routing.json` to zip root
6. Bundle with existing `build-flove-zip.sh`
7. Upload to GitHub Releases via `update-web` skill

### Distribution
- Download button on flove.org
- GitHub Releases (attached to release artifacts)
- Direct URL: `flove.org/flove.zip`

### README.md in zip (I06)
App list with one-line descriptions. Format per app: `**App Name** — description`

## Tasks

1. Add meta tags to all app HTML files (tier, description, tags)
2. Extend `build-flove-zip.sh` to scan apps and generate routing.json
3. Add routing.json validation (required fields check)
4. Add README.md to zip
5. Extend `update-web` to upload zip to GitHub Releases
6. Wire routing.json fetch in apps (if needed for discovery)

## Conflicts

- L04/L05/L06 still pending but not blocking (routing.json is same-origin)
