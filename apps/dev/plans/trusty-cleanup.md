# Plan: Trusty SIGNALS Cleanup + App Links

> Decisions: TRU01-TRU02 (SIGNALS removal), M03-M05 (maty links),
> M06-M08 (evily/myfamily links), C07/C11/C14/C26 (deep links).

## Decisions made

| Topic | Decision |
|-------|----------|
| Reciprocity in SIGNALS | Remove (keep only in CONDITIONS) |
| Transparency in SIGNALS | Remove (keep only in CONDITIONS) |
| Remaining SIGNALS | Keep all 4 |
| "See I'm not okay" → maty | Don't add link (generic) |
| "Speak well of me" → maty | Don't add link (generic) |
| "Respect a no" → evily | Add link |
| "Keep a secret" → evily | Add link |
| "Let a bond end kindly" → myfamily | Add link |
| Deep link direction | One-way: trusty → maty/evily |
| Deep link mechanism | URL params `?from={source_app}&item={item_id}` |
| HTML format | Separate div below item |

## Changes to trusty.html

### SIGNALS section
- ✅ Reciprocity removed (done)
- ✅ Transparency/visibility removed (done)
- 4 remaining items stay as-is

### PEOPLE section — app links
Add to these items:
- Safety > Limits: "Respect a no / a limit" → evily link
- Privacy & Words > Secrets: "Keep a secret" → evily link
- Care > Staying power: "Let a bond end kindly" → myfamily link

NOT added (generic):
- Heart > Presence: "See I'm not okay before I say it" → no maty link
- Heart > Loyalty: "Speak well of me when I'm not in the room" → no maty link

### App link HTML format
```html
<div class="app-link">
  <a href="../evily/evily.html?from=trusty&item=respect-a-no">
    → evily: limits & consent
  </a>
</div>
```
Style: small muted text with arrow (I10).
Rendering: auto-generate `<a>` from `app` field in data (I01).
Missing params: show target app normally, ignore (I02).

## Tasks

1. ~~Remove Reciprocity from SIGNALS array~~ ✅
2. ~~Remove Transparency/visibility from SIGNALS array~~ ✅
3. Add app link div to "Respect a no" → evily
4. Add app link div to "Keep a secret" → evily
5. Add app link div to "Let a bond end kindly" → myfamily
6. Style `.app-link` class (consistent across trusty)
7. Test deep links work with URL params

## Conflicts

- None — all decisions resolved
