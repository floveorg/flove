# flove private add-on — the §13.13 **High** locking demo (F0/F1)

- **Date:** 2026-06-25
- **Status:** design approved (brainstorming) — pending implementation plan
<!-- ↗ pendings:#DS02 -->
- **Anchors:** `context/flove/backend_plan.md` **§13.13 · Locking** (this add-on
  is the canonical **demo of the High method**) and the **F0/F1** strands of
  the JS distro (§15).
- **Updates §13.13:** adds an **optional recovery phrase** to High (the section
  currently says High has *no* recovery); records the **multiuser copied-folder**
  model; points at this spec as the High reference.

> **Correction note.** An earlier draft of this design mis-anchored on nety's
> Ed25519 corporate-identity keystore (F4). That is a different subsystem. The
> real subject — per the lock/crypto/password keywords routing to §13 — is
> **§13.13 F0-file-set locking + the crypter pass**. This spec is re-anchored
> there. Any local identity keypair, if an F0 profile holds one, is simply one
> more item inside the crypted set; it is **not** the centre of this feature.

## 1. Summary

An **optional, private add-on** that is the **demo / reference implementation
of §13.13's High locking method** for the **F0/F1** local distro. Off by
default. When enabled it does the §13.13 "generate once, crypt forever" flow:
the user **owns a crypter pass** (typed or generated), **Enable** decrypts the
locked set, and **Crypt on exit** re-encrypts everything under that one pass on
session close — so at rest the F0/F1 data is **real AES-GCM ciphertext**.

It is a **variant/mode** (a `-private` quality), **not a tier**: the tier
ladder and its upgrade routing are untouched — *upgrade → basic* opens
`appy-basic.html`, *upgrade → normal* opens the flove.org root index.

## 2. Goals & non-goals

**Goals**
- Demonstrate **genuine High** (§13.13): F0/F1 content/data at rest is
  ciphertext; without the crypter pass there is nothing to read.
- The **one-button** surface the simplification asks for, **pinned to appy's
  Privacy tab** (§6): an **"Enable login"** control, plus the **"Crypt on exit"**
  button and the **"change apps crypter pass"** field §13.13 already names.
- **One crypter pass for the whole set** (`data-flove-lock-set`), entered once,
  reused to re-encrypt on close.
- An **optional recovery phrase** so a forgotten pass is survivable (the §13.13
  update).
- Ship as a thin shared layer every F0/F1 app can adopt **incrementally**;
  users who never enable it see no change.

**Non-goals (this spec)**
- The §13.13 **Low / Mid** deterrent methods and the **threshold** trigger —
  out of scope here; this add-on is the **High + pass** demo only. (They remain
  documented in §13.13.)
- Server auth, JWT, sessions, multi-device sync, biometrics.
- nety's Ed25519 corporate identity (separate subsystem).
- The **multiuser-pack mechanics** (copy count, generation, labelling) —
  deferred to its own spec; here we only guarantee per-copy isolation.
- Argon2 KDF (PBKDF2 ships first; Argon2 noted as an upgrade).

## 3. Threat model (the §13.13 honesty rule)

**Protects:** F0/F1 data **at rest** as real ciphertext — another person or
process reading the device's browser storage finds only AES-GCM blobs. Across
multiuser copies, one copy cannot read another's data even in the same browser.
This is the **only** §13.13 level that is real protection.

**Does not protect against:** malware / malicious script in an **unlocked**
session; a backdoored build; shoulder-surfing while unlocked; the OS/browser.
Per §13.13's honesty rule, the UI never over-claims — it says "encrypted at
rest", not "unbreakable".

## 4. Mechanism — where "all files" actually live

A static `.html` on disk **cannot rewrite itself** on close, so "crypt all
files" is realized as **always-encrypted-at-rest content/data in browser
storage**, with the HTML acting as a decrypting shell:

- A shared **`flove.lock` / `flove.store`** layer in `docs/flove.js`:
  `await get/set/remove/keys` over **IndexedDB**, each value **AES-GCM-256**
  (fresh IV per write). The locked content set (e.g. the `minifull` feature
  payload) is held the same way — a ciphertext blob, decrypted into the page
  only after Enable.
- **In-memory data key** while unlocked; **never** persisted in plaintext.
  Locked = no key → `get` returns a `LOCKED` sentinel and the §13.13 gate panel
  (`flove-lock` / `lock-gate`) sits at the top withholding the page.
- **Passthrough until enabled:** before the add-on is on, the layer proxies to
  plaintext `localStorage`, so F0/F1 behave exactly as today; enabling runs a
  one-time **migration** of existing plaintext into the encrypted store.
- *(Optional, noted not required: the File System Access API could re-encrypt
  real on-disk files if the user grants folder access — heavier, permission
  prompts. The demo uses browser storage.)*

### 4.1 Multiuser isolation (browser storage is per-origin)

Ten copied distro folders served from one origin would share one IndexedDB. So
every copy carries a distinct **`distroId`**; the layer **namespaces** every key
as `distroId : key`, and each copy's key is derived only from **that copy's
crypter pass**. Copies are isolated twice over — by namespace and by key
material — so even 10 copies in one browser are mutually unreadable.

## 5. Key hierarchy (the "generate once, crypt forever" wrap)

```
crypter pass ──PBKDF2-HMAC-SHA-256(salt, high iters)──▶ KEK ──wraps──▶ DK
recovery phrase ──derive──▶ recovery-KEK ───────────────────wraps──▶ DK
                                          DK (random AES-GCM-256) encrypts
                                          the whole locked set (data + content)
```

- **KEK** from the crypter pass + a random per-copy salt (WebCrypto PBKDF2, no
  dependency).
- A random **DK** encrypts the set. The DK is stored **wrapped** by the KEK, so
  **changing the crypter pass** (`lock-crypter-pass`) only **re-wraps the DK** —
  no bulk re-encryption.
- **Recovery phrase (§13.13 update):** a BIP39-style mnemonic derived from the
  DK seed wraps the DK **independently** of the pass. Forgot pass → enter phrase
  → unwrap DK → set a new pass. Shown **once** on Enable, with an "I saved it"
  confirm. (A second secret to guard — stated plainly.)
- **Wrong pass / tampered blob** fails closed (GCM auth failure → reject).

## 6. UX flow — appy's Privacy tab (the one-button surface)

**Home: appy's account → Privacy tab.** appy already ships a **Privacy tab**
(`#tab-privacy`, `switchTab('privacy')`) in `appy-mini.html` (~line 1967) and
`appy-basic.html`, today a **hidden placeholder** (`d-none`) next to the
existing **Settings** export (`getSettings()`). The add-on **un-hides and
populates that tab** with the controls below — no new surface invented. appy is
the F0/F1 account hub, so this carries through the tiers (mini = F0, basic =
F1). Reusing §13.13's named hooks:

1. **Enable login** (`lock-enable`, off by default). → create-or-generate the
   crypter pass: type one, or **Generate** (`lock-pass-gen`) re-rolls a fresh
   random pass each click (one at a time, **Copy** via `lock-pass-copy`).
2. **Enable** → generate salt + DK, wrap DK under the KEK, **migrate** existing
   plaintext in, then show the §13.13 note —
   *"Enjoy more features from now. You can also change and use this password for
   crypting all your files when you close your session."* — and **show the
   recovery phrase once**.
3. **Crypt on exit** (`lock-crypt-exit`, caption *"Leave all encrypted when you
   close, add the password to decrypt it"*). When armed, the set is
   (re-)encrypted under the crypter pass on session close; next open is
   ciphertext until the pass is entered. (Realized as: the in-memory key is
   dropped on tab close / logout / idle ~15 min; data was already at-rest
   ciphertext — same user experience, correct mechanics.)
4. **Locked state:** opening any F0/F1 file while locked shows the gate panel /
   unlock prompt.
5. Controls: **Lock now**; **Change apps crypter pass** (`lock-crypter-pass`,
   re-wraps DK); **Forgot pass → recovery phrase**; **Disable** (decrypt back to
   plaintext, with warning).
6. **Multi-tab:** lock/unlock propagates via `BroadcastChannel` (fallback:
   `storage` event).

## 7. Plan reconciliation (what to change in backend_plan.md)

- **§13.13 High row:** "no recovery" → **recovery phrase optional** (one-time
  mnemonic; see this spec §5).
- **§13.13:** add a line noting this add-on is the **High reference demo**, and
  record the **multiuser copied-folder** isolation model (`distroId` namespace +
  per-copy pass; §4.1 here).
- **F0/F1 strand list + the F0/F1 add-ons column (§15):** list this as the
  **optional private add-on** (login + at-rest High encryption + multiuser
  pack), pointing here.
- nety §13/F4 are **not** changed by this spec (the earlier draft's reframing
  there was the mis-anchor; reverted).

## 8. Testing

**Unit / crypto:** KEK determinism (pass+salt→KEK); DK wrap/unwrap under KEK and
under recovery-KEK; AES-GCM roundtrip (fresh IV); mnemonic→DK recovery
reproduces the DK; wrong pass / tampered blob → GCM auth-fail → clean reject;
change-pass keeps data, old pass fails; disable restores exact plaintext.

**Integration:** F0 app read/write through the layer locked vs unlocked; one-time
plaintext→ciphertext migration (no loss/dupes); idle-timeout + crypt-on-exit
drop the key; multi-tab lock sync; **isolation** — two copies, different
`distroId` + different pass, same origin, cannot read each other.

## 9. Open questions (deferred multiuser-pack spec)

- Default copy count; how `distroId`s are assigned/labelled per person.
- Whether a thin launcher lists the copies or each is opened directly.
- Whether copies share anything (assumed: no — fully isolated).
