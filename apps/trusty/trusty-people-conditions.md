# Trusty — People & Conditions (design notes)

Parallel design track for `trusty.html`. Two new buttons/axes:

- **People** — *trusting someone for different issue-areas*, organized in **9 categories** (Heart-first; Loyalty folded into Heart). Each category is a three-layer stack:
  - **Main** — the broad, informal *container phrase* (the headline you recognize first).
  - **Formal** — mainstream, everyday trust items.
  - **Original** — flove-distinctive items.
- **Conditions** — the trust conditions list, **optimized against `dealy.html`'s clause taxonomy** (reframed from *lending a thing* to *trusting a person*).

Handoffs to specialized sibling apps are tagged `→ app` (daty · maty · hoty · parenty · myfamily · crumbly · evily; Dealy = economy folder). Tagged items should render as a **handoff callout** (a "→ Open [App]" button), not a plain checkbox, so trusty stays broad and never duplicates a sibling.

> All Mains confirmed. The People list renders as a **single list with Original items highlighted differently** (not separate tabs).

---

## PART A · People — trusting someone for…

### 1 · 💗 Heart  *(includes Loyalty)*
**Main:** *"They hold my heart, and have my back"*

**Formal**
1. Be there when I'm low
2. Hold space for my feelings
3. Have my back / take my side
4. Stay loyal — don't betray me
5. Keep loving me when I'm hard to love

**Original**
6. Let me be unfinished, still becoming
7. See I'm not okay before I say it
8. Speak well of me when I'm not in the room

### 2 · ⏱️ Time
**Main:** *"They won't waste my time"*

**Formal**
9. Show up on time
10. Meet a deadline
11. Cover / swap a shift
12. Give notice before cancelling
13. Reply within a reasonable time

**Original**
14. Keep a slow pace with me, no rushing
15. Remember the dates that matter to me

### 3 · 🔒 Privacy
**Main:** *"My stuff is safe with them"*

**Formal**
16. Keep a secret
17. Not share my photos / messages
18. Handle my data / passwords safely
19. Not read my phone / mail
20. Not screenshot or forward private chats
21. Keep my address / whereabouts private
22. Delete things when I ask

**Original**
23. Not perform our privacy online (no soft-bragging)

### 4 · 💶 Money  *(broad only — transactional specifics → Dealy)*
**Main:** *"They're straight about cash"*

**Formal**
24. Pay me back
25. Split fairly
26. Not overspend shared funds
27. Be transparent about costs
28. Return what they borrow
29. Handle cash / a payment honestly
30. Keep receipts

**Original**
31. Tell me early if they can't pay (no silent default)
32. Not let money change how we treat each other
33. Receive help without shame / give without scorekeeping

### 5 · 🛠️ Skills
**Main:** *"They stand by their work"*

**Formal**
34. Do the job to standard
35. Not cut corners
36. Admit when out of their depth
37. Give honest advice
38. Clean up after the work
39. Stand by their work / fix mistakes

**Original**
40. Teach me instead of doing it for me
41. Let me fail safely while learning
42. Credit my part of the work

### 6 · 🤝 Care
**Main:** *"They'll look after what I love"*

**Formal**
43. Look after my kid → parenty
44. Care for my pet / plants
45. Be there in an emergency
46. Give me meals / medication on time
47. Drive me / pick me up
48. House-sit / watch my home
49. Help when I'm sick
50. Keep an eye on an elder or dependent

**Original**
51. Keep caring when it's boring, not just dramatic
52. Tend a shared bond over years → myfamily
53. Let a bond end kindly when it's run its course → myfamily

### 7 · 📣 Comm
**Main:** *"Straight with me, and kind about it"*

**Formal**
54. Reply / keep in touch
55. Pass on messages faithfully
56. Tell me the truth
57. Keep me in the loop
58. Answer when it matters / pick up
59. Not interrupt or talk over me
60. Give a straight answer

**Original**
61. Tell me the hard thing kindly (don't avoid)
62. Say "I don't know" instead of bluffing
63. Repair after a misunderstanding → maty

### 8 · 🦺 Safety
**Main:** *"They won't put me at risk"*

**Formal**
64. Keep me physically safe
65. Respect a "no" / a limit (knock, ask, personal space)
66. Not put me at risk
67. Have a backup plan
68. Drive safely
69. Lock up / not lose my keys
70. Follow the rules / agreements
71. Call for help when needed

**Original**
72. Warn me of a risk even when inconvenient
73. Honor a safe-word the first time → evily
74. Name the worst case with me in advance → evily

### 9 · ➕ Other / custom
**Main:** *"Whatever it is, I'd trust them with it"*

75. Custom area — name it + one formal + one original

---

## Overlap resolutions (applied)

| Overlap | Decision | Effect |
|---|---|---|
| Noticing "I'm low" — Heart vs Care | → **Heart** | Heart keeps it; Care's main is caretaking ("look after what I love"). |
| "Unfinished / evolving self" — Heart vs Privacy | → **Heart** | Removed Privacy's "keep my evolving self private". |
| "Speak well of me when absent" — Heart vs Comm | → **Heart** | Removed Comm's "represent me accurately". |
| "Holding emotional weight" — Heart vs Privacy | → **Heart** | Removed Privacy's "hold something heavy without making it about them". |
| "Money as relationship" — Money vs Heart | stays **Money** | Money keeps "not let money change how we treat each other". |
| Consent / limits — Safety vs Privacy | → **Safety** | Privacy's "respect my space (knock, ask)" merged into Safety's limit item. |

### Generic trust-types (cross-cutting fields)

The qualities every area is really made of — the actual fields; the numbered items above are their ready-made examples.

- **G1 · Reliability** — keeps their word · *subs:* keeps promises · consistent over time · follows through · shows up
- **G2 · Honesty** — truthful · *subs:* no lies/omissions · admits "I don't know" · straight answers
- **G3 · Accountability** — owns the outcome · *subs:* owns mistakes · apologizes · makes it right
- **G4 · Goodwill** — wants my good · *subs:* my interest at heart · not self-serving · considers how I feel
- **G5 · Integrity** — same everywhere · *subs:* private self = public self · actions match values · holds under pressure
- **G6 · Respect** — honors my limits · *subs:* takes "no" · doesn't pressure · leaves me the final say
- **G7 · Discretion** — handles the sensitive · *subs:* keeps confidences · reads the room · doesn't overshare (≈ Privacy)
- **G8 · Competence** — actually able · *subs:* has the skill · knows their limits · prepares (≈ Skills)

**Category → trust-types** (each area is a profile of 2–3 G-types — what the form captures):

| Category | Primary trust-types |
|---|---|
| 💗 Heart | **G4 Goodwill** · G6 Respect · G5 Integrity (+ loyalty) |
| ⏱️ Time | **G1 Reliability** · G4 Goodwill |
| 🔒 Privacy | **G7 Discretion** · G5 Integrity |
| 💶 Money | **G1 Reliability** · G2 Honesty · G3 Accountability |
| 🛠️ Skills | **G8 Competence** · G3 Accountability |
| 🤝 Care | **G4 Goodwill** · G1 Reliability · G6 Respect |
| 📣 Comm | **G2 Honesty** · G7 Discretion · G6 Respect |
| 🦺 Safety | **G4 Goodwill** · G6 Respect · G1 Reliability |

---

## PART B · Conditions — optimized with Dealy's clauses

Dealy's clause taxonomy (lending/sharing a *thing*) reframed for trusting a *person*. Kept the proven family structure (timing · place · purpose · care · who-qualifies · reciprocity · transparency), dropped thing-only clauses (transportable, all-climates, by-any-transport), and merged in trusty's own limitations + signals.

Source families reused → Dealy: `tempo-clause`, `place-clause`, `purpose-clause`, `uso-clause`, `dest/known/all-clause`, `volunteer/fixed/achega-clause`, `intention-clause`.

### C-A · Duration & timing  *(from Dealy tempo/onrequest/afteruse)*
1. Open-ended — no fixed window
2. Fixed period — start → end date
3. Per occasion / per session only
4. A deadline to begin
5. A minimum span
6. A maximum span
7. Until a certain external event happens (e.g. "until you move out")
8. Until something internal changes (e.g. "until I feel ready")
9. Terms revisited / renegotiated each time
10. One commitment at a time (no parallel)
11. Agree the end together (not unilateral)

### C-B · Place & context  *(from Dealy place)*
12. Only in certain settings/contexts
13. Only when I'm present / together
14. Only around certain people
15. Not around certain people

### C-C · Purpose  *(from Dealy purpose)*
16. Granted only for a stated purpose — choose: care · work/study · creative · celebration/event · community · livelihood · ecological · spiritual · activist
17. Not for any other purpose without asking

### C-D · Care & handling  *(from Dealy uso)*
18. Revocable at any time
19. Granted freely / no strings
20. Report problems promptly
21. Leave things (or the situation) as found — or better
22. No misuse; no passing it on to others without asking
23. Repair / make good if something breaks

### C-E · Who qualifies / pre-conditions  *(from Dealy dest/known/all)*
24. Vouched for by someone
25. Based on reputation / endorsed
26. A maturity or age threshold
27. A sobriety condition
28. A skill / qualification needed
29. Certain people must be present
30. Certain people must be absent
31. Transferable to another person? (yes / no)

### C-F · Reciprocity / what's given back  *(from Dealy volunteer/fixed/achega)*
32. Nothing expected — a gift
33. In kind — return the favor
34. Time instead
35. Cover the cost / a deposit upfront
36. Documentation as the "payment" (receipts / a shared log)

### C-G · Transparency  *(from Dealy intention)*
37. A record / log is kept
38. Visible to our circle / others
39. A check-in cadence (how often we touch base)

### C-H · Trusty-native limitations & signals  *(already in `trusty.html`)*
40. Truster limitations — what I can't promise
41. Trustee limitations — what they shouldn't do
42. Additional grants given
43. Confidence level (the scope-confidence slider)
44. Potential range — best case / worst case
45. Trustful signals: track record · references · transparency · reciprocity · documentation · small tests

---

## Open questions
1. ~~**People button**~~ — resolved: **one list, Original items highlighted differently** (not separate tabs).
2. ~~**Money handoff**~~ — resolved: transactional specifics (amounts, schedules, interest, collateral) → **Dealy**; trusty keeps the broad/relational money items only.
3. **Conditions overlap** — C-D/C-E overlap trusty's existing "Additional Protection" fields (40–42). Merge them into this taxonomy, or keep Protection as the free-text version and Conditions as the pick-list?
4. **Granular mode** — when a trust accrues many small conditions, offer `→ crumbly` for the fine tick-list?
5. ~~**Mains**~~ — confirmed (Heart · Care · Comm · Other).
