# nety-trust — Implementation Plan

> Derived from interview decisions Q6, Q7, Q8 (2026-07-22).
> Source spec: `making-of/superpowers/specs/2026-06-18-nety-access-ecosystem-design.md` §4

## Decisions

| Q | Decision | Source |
|---|----------|--------|
| Q6 | Ranking = **Weighted by trust/stage** + curator bonus ×3, 10%/week decay (C01) |
| Q7 | Curators = **Self-selected + community veto** |
| Q8 | Abuse Tier 1 = **self-selection + veto + report form** (C02) — checkbox list + text, predefined options (I07) |

## Trust-weighted ranking (Q6)

Ranking formula (from NEC04 §4.1):

```
rank_score = user_stage_weight × content_quality × time_decay
```

- `user_stage_weight`: newbie=1, known=2, homie=5, expert=10, legend=25
- Content quality: upvotes/downvotes from other users, weighted by voter's stage
- Time decay: exponential, half-life ~7 days

### Anti-gaming (from NEC04 §4.2)

- Diversity-weighted vouches: vouches from densely interlinked peers discounted
- Collusion resistance: mutual-vouch rings self-cancel
- Graduated abuse slashing: minor=partial facet reduction, severe=near-zero

## Self-selected curators (Q7)

### Selection mechanism

1. Any user with stage ≥ `known` can apply to be curator
2. Application visible to all users at stage ≥ `homie`
3. Community veto: within 7 days, any `homie+` can veto
4. Veto threshold: >50% of `homie+` users who voted veto
5. If not vetoed → curator status granted

### Curator powers (from NEC01 §3.8)

- Review publishing queue (pending → reviewed → live)
- Admit users into `basic` without invite
- Gate `normal` stage approval
- Handle urgent abuse reports (Q8)

### Accountability

- Curator actions logged publicly
- Community veto can remove curators
- Abuse by curators → escalated to jury (Q8)

## Hybrid abuse adjudication (Q8)

### Tier 1: Curator handling (urgent)

- Spam, obvious abuse, clear violations
- Curator can: warn, temporarily mute, slash facets
- Response time: <24 hours
- Appeal → Tier 2

### Tier 2: Jury handling (complex)

- Disputed cases, nuanced abuse, curator appeals
- Random jury of 5 users at stage ≥ `homie`
- Jury selected from outside complainant's invite tree (conflict of interest avoidance)
- Response time: <7 days
- Decision: uphold, overturn, or modify curator action
- No further appeal (final)

### Escalation criteria

| Signal | Goes to |
|--------|---------|
| Obvious spam/abuse | Curator (Tier 1) |
| Disputed by user | Jury (Tier 2) |
| Curator abuse | Jury (Tier 2) |
| Complex, multi-party | Jury (Tier 2) |

## Implementation tasks

- [ ] T1: Implement stage weight table for ranking
- [ ] T2: Build ranking display (Activity tab)
- [ ] T3: Build curator application flow
- [ ] T4: Build community veto mechanism
- [ ] T5: Build curator queue review UI
- [ ] T6: Build Tier 1 abuse handling (curator)
- [ ] T7: Build Tier 2 jury selection + voting
- [ ] T8: Wire escalation from Tier 1 → Tier 2

## Conflicts to watch

- **Q6 × Q7 circular dependency**: curators gate stages, stages weight ranking → a new self-selected curator has the same ranking weight as a legend until trust catches up. Mitigation: curator status grants a temporary "curator bonus" weight (e.g. ×3) that decays over time if not backed by stage.
- **Q8 × deferred infrastructure**: hybrid abuse needs jury pool definition, escalation criteria, appeal flow → all deferred. Build Tier 1 first (curator-only), add Tier 2 later.
- **Q7 self-selected × NEC01 "curator accountability deferred"**: the spec explicitly defers curator selection/accountability. Q7 decides it now, but the spec needs updating.

## Pending decisions that affect this plan

- Q5: Crypto key recovery (affects key rotation for compromised curator accounts)
- Q26: Visibility controls (affects what curator actions are visible)
