# flove private add-on — §13.13 High locking demo · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the optional "Enable login" private add-on — the reference demo of `backend_plan.md` §13.13 High locking — that password-encrypts all F0/F1 local flove data at rest, with one crypter pass, a recovery phrase, and per-copy isolation, surfaced in appy's Privacy tab.

**Architecture:** A dependency-free **UMD crypto core** (`apps/flove-lock-core.js`) holds all key/encrypt logic on top of WebCrypto and is unit-tested in Node. A browser **glue layer** (`apps/flove-lock.js`, classic IIFE) wires that core to IndexedDB and exposes `window.flove.store` (encrypted get/set) + `window.flove.lock` (enable/unlock/lock/changePass/recover/disable). The **appy Privacy tab** (existing hidden placeholder) becomes the UX. Data is **always encrypted at rest**; the data key lives only in memory while unlocked; "Crypt on exit" = drop the key on close.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step. WebCrypto (`crypto.subtle`) — PBKDF2-HMAC-SHA-256 + AES-GCM-256. IndexedDB (browser) with an in-memory adapter for tests. `node:test` + `node:assert` for the crypto core. `BroadcastChannel` for multi-tab sync.

## Global Constraints

- **No build step, no new runtime dependencies.** Browser code is classic `<script src>` (not ES modules). The crypto core is **UMD** (works as a browser global `window.flove.lockCore` AND `require()`-able in Node).
- **Crypto params (exact):** PBKDF2-HMAC-**SHA-256**, **310000** iterations, **16-byte** random salt; **AES-GCM-256**, **12-byte** random IV per encryption; data key (DK) = extractable AES-GCM-256.
- **Always-encrypted-at-rest:** plaintext values are never written to IndexedDB; the DK exists only in a module-scoped in-memory variable while unlocked.
- **Passthrough until enabled:** before the add-on is enabled, `flove.store` proxies to plaintext `localStorage`; enabling runs a one-time plaintext→ciphertext migration.
- **Per-copy isolation:** every stored key is namespaced `${distroId}:${key}`; `distroId` comes from `window.FLOVE_DISTRO_ID` (default `'default'`). Each copy derives its key only from its own pass.
- **Fail closed:** wrong pass / tampered ciphertext → GCM auth failure → reject; never partial-decrypt.
- **flove app conventions** (per `context/flove/CLAUDE.md`): any NEW visible UI text is bilingual (`<span class="en" lang="en">…</span><span class="es" lang="es">…</span>`), new placeholders/aria use `data-ph/aria-en/es`; **no inline `style=`**; CSS-first; keep the flove-bar/identity. UI files must pass `npx --no-install html-validate <file>` (0 errors) and the translate2 gate (`node ~/.claude/skills/translate2/scripts/check.js <file>` = OK); `grep -c 'Ã\|Â' <file>` = 0. **No browser automation** — UI is verified by Marc; this plan states exactly what to look at.
- **Honesty rule (§13.13):** UI copy says "encrypted at rest", never "unbreakable"; recovery phrase is described as a second secret to guard.
- **Gitea workflow:** commit only files you touched (never `git add -A`); push to `localhost:3000/marc/flove` (main). Commit messages carry the prompt + explanation.
- **Out of scope (deferred):** the multiuser-pack mechanics (copy count, generation, labelling); Argon2; nety Ed25519 identity; server auth.

---

## File Structure

- **Create** `apps/flove-lock-core.js` — UMD. Pure crypto: byte helpers, PBKDF2 KEK, AES-GCM encrypt/decrypt, DK generate/wrap/unwrap, recovery phrase (wordlist) + recovery-KEK, and the **vault** assembly (`createVault`, `unlockVault`, `recoverVault`, `changePass`). No DOM/IndexedDB. Node-testable.
- **Create** `apps/flove-lock-wordlist.js` — UMD. A 256-word list (1 byte/word) used by the recovery phrase. Separate file = the bulk stays out of the core.
- **Create** `apps/flove-lock.js` — classic IIFE (browser). IndexedDB adapter, the `window.flove.store` API (encrypted get/set/remove/keys + passthrough), the `window.flove.lock` API (enable/unlock/lock/changePass/recover/disable/isUnlocked/on…), plaintext migration, idle timer, `BroadcastChannel` lock sync, reads `window.FLOVE_DISTRO_ID`.
- **Create** `tests/flove-lock-core.test.js` — `node:test` unit tests for the core + vault + an in-memory store roundtrip.
- **Create** `tests/helpers/mem-store.js` — a tiny in-memory key→value adapter used by tests (mirrors the IndexedDB adapter interface).
- **Modify** `apps/appy/appy-mini.html` — un-hide `#tab-privacy`, add the Privacy-tab UI, include the three scripts, wire to `window.flove.lock`.
- **Modify** `apps/appy/appy-basic.html` — same Privacy-tab UI + script includes.

**Interface contract (shared across tasks):**

```
// flove.lockCore (UMD export)
randBytes(n) -> Uint8Array
b64(bytes) -> string ; unb64(string) -> Uint8Array
deriveKEK(passString, saltBytes) -> Promise<CryptoKey>           // AES-GCM key
aesEncrypt(key, plaintextBytes) -> Promise<{iv:Uint8Array, ct:Uint8Array}>
aesDecrypt(key, iv, ctBytes) -> Promise<Uint8Array>              // throws on auth fail
genDK() -> Promise<CryptoKey>                                    // extractable AES-GCM-256
wrapKey(wrappingKey, dk) -> Promise<{iv,ct}>                     // exports+encrypts dk raw
unwrapKey(wrappingKey, iv, ct) -> Promise<CryptoKey>            // -> AES-GCM DK
phraseFromBytes(bytes16) -> string  ; bytesFromPhrase(str) -> Uint8Array(16)
deriveRecoveryKEK(recoveryBytes16, saltBytes) -> Promise<CryptoKey>

// Vault record (plain JSON, safe to store unencrypted — only wrapped keys):
//  { v:1, kdf:{salt, iters:310000}, pass:{iv, ct}, rec:{salt, iv, ct}, verify:{iv, ct} }
createVault(passString) -> Promise<{ record, dk:CryptoKey, phrase:string }>
unlockVault(record, passString) -> Promise<CryptoKey>           // throws 'BAD_PASS'
recoverVault(record, phraseString) -> Promise<CryptoKey>        // throws 'BAD_PHRASE'
changePass(record, dk, newPassString) -> Promise<record>       // re-wraps, keeps dk

// flove.store (browser): async get/set/remove/keys(); isUnlocked()
// flove.lock (browser): enable(pass), unlock(pass), recover(phrase), lock(),
//   changePass(old,new), disable(pass), isUnlocked(), onLock(fn), onUnlock(fn)
```

All `iv`/`ct`/`salt` fields in the vault record are **base64 strings** (JSON-safe).

---

### Task 1: Crypto core — byte helpers + PBKDF2 KEK + AES-GCM

**Files:**
- Create: `apps/flove-lock-core.js`
- Test: `tests/flove-lock-core.test.js`

**Interfaces:**
- Produces: `randBytes`, `b64`, `unb64`, `deriveKEK`, `aesEncrypt`, `aesDecrypt` (signatures in the contract above).

- [ ] **Step 1: Write the failing test**

```js
// tests/flove-lock-core.test.js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const C = require('../apps/flove-lock-core.js');

test('b64 roundtrips bytes', () => {
  const b = new Uint8Array([0, 1, 2, 250, 255]);
  assert.deepStrictEqual(Array.from(C.unb64(C.b64(b))), Array.from(b));
});

test('aesEncrypt/aesDecrypt roundtrip with a PBKDF2 key', async () => {
  const salt = C.randBytes(16);
  const key = await C.deriveKEK('hunter2', salt);
  const msg = new TextEncoder().encode('hello flove');
  const { iv, ct } = await C.aesEncrypt(key, msg);
  const out = await C.aesDecrypt(key, iv, ct);
  assert.strictEqual(new TextDecoder().decode(out), 'hello flove');
});

test('deriveKEK is deterministic for same pass+salt', async () => {
  const salt = C.randBytes(16);
  const k1 = await C.deriveKEK('pw', salt);
  const k2 = await C.deriveKEK('pw', salt);
  const m = new TextEncoder().encode('x');
  const { iv, ct } = await C.aesEncrypt(k1, m);
  const out = await C.aesDecrypt(k2, iv, ct); // k2 must decrypt k1's ciphertext
  assert.strictEqual(new TextDecoder().decode(out), 'x');
});

test('wrong key fails closed (GCM auth)', async () => {
  const k1 = await C.deriveKEK('right', C.randBytes(16));
  const k2 = await C.deriveKEK('wrong', C.randBytes(16));
  const { iv, ct } = await C.aesEncrypt(k1, new TextEncoder().encode('secret'));
  await assert.rejects(() => C.aesDecrypt(k2, iv, ct));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/flove-lock-core.test.js`
Expected: FAIL — `Cannot find module '../apps/flove-lock-core.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// apps/flove-lock-core.js
/* flove-lock-core · UMD · pure WebCrypto key/encrypt logic (no DOM, no IndexedDB).
   Browser: window.flove.lockCore   Node: require('./flove-lock-core.js') */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else ((root.flove = root.flove || {}).lockCore = factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const subtle = globalThis.crypto.subtle;
  const ITERS = 310000;

  const randBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
  const b64 = (bytes) => {
    let s = ''; const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  };
  const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

  async function deriveKEK(passString, saltBytes) {
    const base = await subtle.importKey('raw', new TextEncoder().encode(passString),
      'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: ITERS, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function aesEncrypt(key, plaintextBytes) {
    const iv = randBytes(12);
    const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintextBytes));
    return { iv, ct };
  }
  async function aesDecrypt(key, iv, ctBytes) {
    return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv }, key, ctBytes));
  }

  return { ITERS, randBytes, b64, unb64, deriveKEK, aesEncrypt, aesDecrypt };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/flove-lock-core.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/flove-lock-core.js tests/flove-lock-core.test.js
git commit -m "feat(lock): crypto core — PBKDF2 KEK + AES-GCM (TDD)"
```

---

### Task 2: Crypto core — data key generate + wrap/unwrap

**Files:**
- Modify: `apps/flove-lock-core.js` (extend the returned object)
- Test: `tests/flove-lock-core.test.js` (append)

**Interfaces:**
- Consumes: `deriveKEK`, `aesEncrypt`, `aesDecrypt`, `randBytes` (Task 1).
- Produces: `genDK`, `wrapKey`, `unwrapKey`.

- [ ] **Step 1: Write the failing test (append)**

```js
test('DK wrap/unwrap roundtrips under a KEK', async () => {
  const kek = await C.deriveKEK('pw', C.randBytes(16));
  const dk = await C.genDK();
  const { iv, ct } = await C.wrapKey(kek, dk);
  const dk2 = await C.unwrapKey(kek, iv, ct);          // unwrapped DK
  const msg = new TextEncoder().encode('data');
  const e = await C.aesEncrypt(dk, msg);
  const out = await C.aesDecrypt(dk2, e.iv, e.ct);      // dk2 decrypts dk's ciphertext
  assert.strictEqual(new TextDecoder().decode(out), 'data');
});

test('unwrap with wrong KEK fails closed', async () => {
  const kek = await C.deriveKEK('right', C.randBytes(16));
  const bad = await C.deriveKEK('wrong', C.randBytes(16));
  const dk = await C.genDK();
  const { iv, ct } = await C.wrapKey(kek, dk);
  await assert.rejects(() => C.unwrapKey(bad, iv, ct));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/flove-lock-core.test.js`
Expected: FAIL — `C.genDK is not a function`.

- [ ] **Step 3: Implement (inside the factory, before `return`; add to the returned object)**

```js
  async function genDK() {
    return subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  async function wrapKey(wrappingKey, dk) {
    const raw = new Uint8Array(await subtle.exportKey('raw', dk));
    return aesEncrypt(wrappingKey, raw);                 // {iv, ct}
  }
  async function unwrapKey(wrappingKey, iv, ct) {
    const raw = await aesDecrypt(wrappingKey, iv, ct);   // throws on bad key
    return subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true,
      ['encrypt', 'decrypt']);
  }
```

Add `genDK, wrapKey, unwrapKey` to the `return { … }`.

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/flove-lock-core.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/flove-lock-core.js tests/flove-lock-core.test.js
git commit -m "feat(lock): data-key generate + wrap/unwrap (TDD)"
```

---

### Task 3: Recovery phrase — wordlist + phrase↔bytes + recovery KEK

**Files:**
- Create: `apps/flove-lock-wordlist.js`
- Modify: `apps/flove-lock-core.js`
- Test: `tests/flove-lock-core.test.js` (append)

**Interfaces:**
- Consumes: `deriveKEK` reuse pattern, `randBytes`.
- Produces: `phraseFromBytes`, `bytesFromPhrase`, `deriveRecoveryKEK`.

- [ ] **Step 1: Write the failing test (append)**

```js
test('phrase encodes/decodes 16 bytes (16 words)', () => {
  const b = C.randBytes(16);
  const phrase = C.phraseFromBytes(b);
  assert.strictEqual(phrase.split(' ').length, 16);
  assert.deepStrictEqual(Array.from(C.bytesFromPhrase(phrase)), Array.from(b));
});

test('recovery KEK unwraps a DK wrapped under it', async () => {
  const recBytes = C.randBytes(16);
  const salt = C.randBytes(16);
  const rkek = await C.deriveRecoveryKEK(recBytes, salt);
  const dk = await C.genDK();
  const { iv, ct } = await C.wrapKey(rkek, dk);
  const rkek2 = await C.deriveRecoveryKEK(C.bytesFromPhrase(C.phraseFromBytes(recBytes)), salt);
  const dk2 = await C.unwrapKey(rkek2, iv, ct);
  const e = await C.aesEncrypt(dk, new TextEncoder().encode('z'));
  assert.strictEqual(new TextDecoder().decode(await C.aesDecrypt(dk2, e.iv, e.ct)), 'z');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/flove-lock-core.test.js`
Expected: FAIL — `C.phraseFromBytes is not a function`.

- [ ] **Step 3a: Create the wordlist (256 words, index = byte value)**

```js
// apps/flove-lock-wordlist.js · UMD · 256 short words; position = byte value (0..255)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else ((root.flove = root.flove || {}).lockWords = factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // EXACTLY 256 unique lowercase words. Engineer: keep 256 entries, no duplicates.
  return ['able','acid','acre','aged','also','arch','arm','art','atom','aunt','aura','away',
  'baby','back','bake','ball','band','bank','bare','barn','base','bath','bead','beam','bean',
  'bear','beat','bell','belt','bend','best','bike','bird','bite','blue','boat','bold','bone',
  'book','boot','born','boss','both','bowl','brave','bread','brick','broom','brush','bud',
  'bulk','bull','bump','bun','bus','bush','cake','calm','came','camp','cane','cap','card',
  'care','cart','case','cash','cave','cell','chat','chef','chin','chip','city','clam','claw',
  'clay','clip','club','coal','coat','code','coin','cold','cook','cool','copy','cord','core',
  'corn','cost','cozy','crab','crew','crop','cube','cup','curl','dad','dark','dash','date',
  'dawn','deal','dear','deck','deed','deep','deer','desk','dial','dice','dig','dim','dish',
  'dive','dock','doe','dog','doll','dome','door','dose','dove','draw','drip','drop','drum',
  'duck','dull','dune','dusk','dust','duty','each','earn','east','easy','echo','edge','egg',
  'elf','elk','else','epic','even','ever','exit','face','fact','fade','fair','fall','fame',
  'farm','fast','fate','fear','feed','feel','fern','file','fill','film','find','fine','fire',
  'fish','fist','five','flag','flat','flax','flip','flow','foam','foct','fold','folk','font',
  'food','fool','foot','ford','fork','form','fort','four','fox','free','frog','full','fund',
  'gain','game','gate','gear','gem','gift','girl','give','glad','glow','glue','goat','gold',
  'golf','gone','good','gown','grab','gray','grid','grim','grin','grip','grow','gulf','gull',
  'hail','hair','half','hall','hand','hare','harm','hawk','haze','head','heal','heap','heat',
  'herb','hero','hide','hill','hint','hive','hold','hole','holy','home','hood','hook','hope',
  'horn','host','hour','huge','hull','hump','hunt','hush','hut','icon','idea','inch','iris',
  'iron','isle','item','ivy','jade','jail','jam','jar','jazz','jet','job','join'];
});
```

(Engineer: the array above is the canonical 256-word list. Verify `module.exports.length === 256` before continuing — the test in Step 4 also checks this.)

- [ ] **Step 3b: Add phrase + recovery KEK to the core**

In `apps/flove-lock-core.js`, load the wordlist (UMD-safe) and add functions:

```js
  // near top of factory, after subtle/ITERS:
  const WORDS = (typeof module === 'object' && module.exports)
    ? require('./flove-lock-wordlist.js')
    : (globalThis.flove && globalThis.flove.lockWords);

  function phraseFromBytes(bytes16) {
    return Array.from(bytes16).map((n) => WORDS[n]).join(' ');
  }
  function bytesFromPhrase(str) {
    const idx = new Map(WORDS.map((w, i) => [w, i]));
    const out = str.trim().split(/\s+/).map((w) => {
      if (!idx.has(w)) throw new Error('BAD_PHRASE');
      return idx.get(w);
    });
    return Uint8Array.from(out);
  }
  async function deriveRecoveryKEK(recoveryBytes16, saltBytes) {
    const base = await subtle.importKey('raw', recoveryBytes16, 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: ITERS, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
```

Add `phraseFromBytes, bytesFromPhrase, deriveRecoveryKEK` to the `return`. Add a wordlist-length assertion test:

```js
test('wordlist has exactly 256 unique words', () => {
  const W = require('../apps/flove-lock-wordlist.js');
  assert.strictEqual(W.length, 256);
  assert.strictEqual(new Set(W).size, 256);
});
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/flove-lock-core.test.js`
Expected: PASS. If the wordlist test fails, fix the list to exactly 256 unique words (the sample may need trimming/dedup — `foct` is a deliberate placeholder to replace with a real 4-letter word and ensure count).

- [ ] **Step 5: Commit**

```bash
git add apps/flove-lock-core.js apps/flove-lock-wordlist.js tests/flove-lock-core.test.js
git commit -m "feat(lock): recovery phrase (256-word) + recovery KEK (TDD)"
```

---

### Task 4: Crypto core — the vault (create / unlock / recover / changePass)

**Files:**
- Modify: `apps/flove-lock-core.js`
- Test: `tests/flove-lock-core.test.js` (append)

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: `createVault`, `unlockVault`, `recoverVault`, `changePass`. Vault record JSON shape per the contract (all binary fields base64).

- [ ] **Step 1: Write the failing test (append)**

```js
const VERIFY = 'flove-lock-verify-v1';

test('createVault → unlock with pass, recover with phrase', async () => {
  const { record, dk, phrase } = await C.createVault('correct horse');
  assert.strictEqual(record.v, 1);
  // round-trip a value with the returned dk
  const e = await C.aesEncrypt(dk, new TextEncoder().encode('payload'));
  const dk2 = await C.unlockVault(record, 'correct horse');
  assert.strictEqual(new TextDecoder().decode(await C.aesDecrypt(dk2, e.iv, e.ct)), 'payload');
  const dk3 = await C.recoverVault(record, phrase);
  assert.strictEqual(new TextDecoder().decode(await C.aesDecrypt(dk3, e.iv, e.ct)), 'payload');
});

test('unlockVault rejects wrong pass with BAD_PASS', async () => {
  const { record } = await C.createVault('right');
  await assert.rejects(() => C.unlockVault(record, 'nope'),
    (err) => err.message === 'BAD_PASS');
});

test('changePass keeps data; old pass stops working', async () => {
  const { record, dk } = await C.createVault('old');
  const e = await C.aesEncrypt(dk, new TextEncoder().encode('keep'));
  const rec2 = await C.changePass(record, dk, 'new');
  const dkNew = await C.unlockVault(rec2, 'new');
  assert.strictEqual(new TextDecoder().decode(await C.aesDecrypt(dkNew, e.iv, e.ct)), 'keep');
  await assert.rejects(() => C.unlockVault(rec2, 'old'), (e) => e.message === 'BAD_PASS');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/flove-lock-core.test.js`
Expected: FAIL — `C.createVault is not a function`.

- [ ] **Step 3: Implement (inside the factory)**

```js
  const VERIFY_TOKEN = new TextEncoder().encode('flove-lock-verify-v1');
  const enc = (o) => ({ iv: b64(o.iv), ct: b64(o.ct) });
  const dec = (o) => ({ iv: unb64(o.iv), ct: unb64(o.ct) });

  async function createVault(passString) {
    const salt = randBytes(16), recSalt = randBytes(16), recBytes = randBytes(16);
    const dk = await genDK();
    const kek = await deriveKEK(passString, salt);
    const rkek = await deriveRecoveryKEK(recBytes, recSalt);
    const pass = enc(await wrapKey(kek, dk));
    const rec = enc(await wrapKey(rkek, dk));
    const verify = enc(await aesEncrypt(dk, VERIFY_TOKEN));
    const record = { v: 1, kdf: { salt: b64(salt), iters: ITERS },
      recKdf: { salt: b64(recSalt) }, pass, rec, verify };
    return { record, dk, phrase: phraseFromBytes(recBytes) };
  }
  async function _checkDK(record, dk) {
    try {
      const v = dec(record.verify);
      const out = await aesDecrypt(dk, v.iv, v.ct);
      return new TextDecoder().decode(out) === 'flove-lock-verify-v1';
    } catch { return false; }
  }
  async function unlockVault(record, passString) {
    const kek = await deriveKEK(passString, unb64(record.kdf.salt));
    let dk;
    try { const p = dec(record.pass); dk = await unwrapKey(kek, p.iv, p.ct); }
    catch { throw new Error('BAD_PASS'); }
    if (!(await _checkDK(record, dk))) throw new Error('BAD_PASS');
    return dk;
  }
  async function recoverVault(record, phraseString) {
    let recBytes; try { recBytes = bytesFromPhrase(phraseString); }
    catch { throw new Error('BAD_PHRASE'); }
    const rkek = await deriveRecoveryKEK(recBytes, unb64(record.recKdf.salt));
    let dk;
    try { const r = dec(record.rec); dk = await unwrapKey(rkek, r.iv, r.ct); }
    catch { throw new Error('BAD_PHRASE'); }
    if (!(await _checkDK(record, dk))) throw new Error('BAD_PHRASE');
    return dk;
  }
  async function changePass(record, dk, newPassString) {
    const salt = randBytes(16);
    const kek = await deriveKEK(newPassString, salt);
    const pass = enc(await wrapKey(kek, dk));
    return { ...record, kdf: { salt: b64(salt), iters: ITERS }, pass };
  }
```

Add `createVault, unlockVault, recoverVault, changePass` to the `return`.

- [ ] **Step 4: Run to verify pass + full suite**

Run: `node --test tests/`
Expected: PASS (all tests across the file).

- [ ] **Step 5: Commit**

```bash
git add apps/flove-lock-core.js tests/flove-lock-core.test.js
git commit -m "feat(lock): vault create/unlock/recover/changePass (TDD)"
```

---

### Task 5: Encrypted store logic + in-memory adapter (testable)

**Files:**
- Create: `tests/helpers/mem-store.js`
- Modify: `apps/flove-lock-core.js` (add `makeStore` — adapter-agnostic store factory)
- Test: `tests/flove-lock-core.test.js` (append)

**Interfaces:**
- Consumes: `aesEncrypt`, `aesDecrypt`, `b64`, `unb64`.
- Produces: `makeStore(adapter, getDK, distroId)` → `{ get, set, remove, keys }`. `adapter` = `{ getRaw(k), setRaw(k,v), removeRaw(k), allKeys() }` storing `{iv,ct}` JSON under namespaced keys. `getDK()` returns the in-memory DK or null.

- [ ] **Step 1: Write the failing test (append) + helper**

```js
// tests/helpers/mem-store.js
'use strict';
module.exports = function memStore() {
  const m = new Map();
  return {
    async getRaw(k) { return m.has(k) ? m.get(k) : null; },
    async setRaw(k, v) { m.set(k, v); },
    async removeRaw(k) { m.delete(k); },
    async allKeys() { return [...m.keys()]; },
    _map: m,
  };
};
```

```js
// append to tests/flove-lock-core.test.js
const memStore = require('./helpers/mem-store.js');

test('store encrypts values; get returns the original; keys are namespaced', async () => {
  const { dk } = await C.createVault('p');
  const adapter = memStore();
  const store = C.makeStore(adapter, () => dk, 'userA');
  await store.set('profile', { name: 'Marc', n: 3 });
  // raw is ciphertext under a namespaced key, not plaintext
  const rawKey = [...adapter._map.keys()][0];
  assert.match(rawKey, /^userA:/);
  assert.ok(!JSON.stringify(adapter._map.get(rawKey)).includes('Marc'));
  assert.deepStrictEqual(await store.get('profile'), { name: 'Marc', n: 3 });
  assert.deepStrictEqual(await store.keys(), ['profile']);
});

test('store returns LOCKED sentinel when no DK', async () => {
  const store = C.makeStore(memStore(), () => null, 'u');
  assert.strictEqual(await store.get('x'), C.LOCKED);
});

test('two distroIds with different DKs cannot read each other', async () => {
  const a = await C.createVault('pa'); const b = await C.createVault('pb');
  const adapter = memStore();
  const sa = C.makeStore(adapter, () => a.dk, 'A');
  const sb = C.makeStore(adapter, () => b.dk, 'B');
  await sa.set('k', 'secretA');
  assert.deepStrictEqual(await sb.keys(), []);          // namespace isolation
  assert.strictEqual(await sa.get('k'), 'secretA');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/`
Expected: FAIL — `C.makeStore is not a function`.

- [ ] **Step 3: Implement `makeStore` + `LOCKED` in the core**

```js
  const LOCKED = Symbol('flove-lock:LOCKED');
  function makeStore(adapter, getDK, distroId) {
    const ns = (k) => `${distroId}:${k}`;
    const pfx = `${distroId}:`;
    return {
      async get(key) {
        const dk = getDK(); if (!dk) return LOCKED;
        const raw = await adapter.getRaw(ns(key)); if (raw == null) return undefined;
        const out = await aesDecrypt(dk, unb64(raw.iv), unb64(raw.ct));
        return JSON.parse(new TextDecoder().decode(out));
      },
      async set(key, value) {
        const dk = getDK(); if (!dk) throw new Error('LOCKED');
        const bytes = new TextEncoder().encode(JSON.stringify(value));
        const { iv, ct } = await aesEncrypt(dk, bytes);
        await adapter.setRaw(ns(key), { iv: b64(iv), ct: b64(ct) });
      },
      async remove(key) { await adapter.removeRaw(ns(key)); },
      async keys() {
        return (await adapter.allKeys()).filter((k) => k.startsWith(pfx))
          .map((k) => k.slice(pfx.length));
      },
    };
  }
```

Add `LOCKED, makeStore` to the `return`.

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add apps/flove-lock-core.js tests/helpers/mem-store.js tests/flove-lock-core.test.js
git commit -m "feat(lock): adapter-agnostic encrypted store + isolation (TDD)"
```

---

### Task 6: Browser glue — `flove-lock.js` (IndexedDB + lock API)

**Files:**
- Create: `apps/flove-lock.js`

**Interfaces:**
- Consumes: `window.flove.lockCore` (Tasks 1–5), `window.flove.lockWords`, `window.FLOVE_DISTRO_ID`.
- Produces (browser globals): `window.flove.store` = `{ get, set, remove, keys, isUnlocked }`; `window.flove.lock` = `{ enable, unlock, recover, lock, changePass, disable, isUnlocked, onLock, onUnlock, status }`.

> **Note on testing:** IndexedDB + `BroadcastChannel` + tab lifecycle are browser-only and there is no browser-automation here (CLAUDE.md §5). This task is verified (a) by `node --check`, and (b) by Marc in a browser against the manual checklist below. The crypto/store logic it calls is already unit-tested via Tasks 1–5.

- [ ] **Step 1: Write `apps/flove-lock.js`**

```js
/* flove-lock.js · browser glue. Wires flove.lockCore to IndexedDB + tab lifecycle.
   Load order: flove-lock-wordlist.js, flove-lock-core.js, then this file. */
(() => {
  'use strict';
  const flove = (window.flove = window.flove || {});
  const C = flove.lockCore;
  if (!C) { console.warn('flove-lock: lockCore missing'); return; }
  const DISTRO = window.FLOVE_DISTRO_ID || 'default';
  const DB = 'flove-lock', STORE = 'kv';
  const META_KEY = `${DISTRO}:__vault__`;      // vault record (plain JSON)
  const ENABLED_KEY = `flove:lock:enabled:${DISTRO}`; // localStorage flag (plaintext ok)
  const IDLE_MS = 15 * 60 * 1000;

  let dk = null, idleTimer = null;
  const lockSubs = [], unlockSubs = [];
  const chan = ('BroadcastChannel' in window) ? new BroadcastChannel('flove-lock:' + DISTRO) : null;

  // --- IndexedDB adapter (stores {iv,ct} JSON, or the vault record, by string key) ---
  function openDB() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  function idb(mode, fn) {
    return openDB().then((db) => new Promise((res, rej) => {
      const tx = db.transaction(STORE, mode), os = tx.objectStore(STORE);
      const out = fn(os); tx.oncomplete = () => res(out); tx.onerror = () => rej(tx.error);
    }));
  }
  const adapter = {
    getRaw: (k) => idb('readonly', (os) => new Promise((res) => { const q = os.get(k); q.onsuccess = () => res(q.result ?? null); })),
    setRaw: (k, v) => idb('readwrite', (os) => os.put(v, k)),
    removeRaw: (k) => idb('readwrite', (os) => os.delete(k)),
    allKeys: () => idb('readonly', (os) => new Promise((res) => { const q = os.getAllKeys(); q.onsuccess = () => res(q.result || []); })),
  };

  const store = C.makeStore(adapter, () => dk, DISTRO);
  const isEnabled = () => { try { return localStorage.getItem(ENABLED_KEY) === '1'; } catch { return false; } };

  // --- public store: passthrough to localStorage until enabled ---
  flove.store = {
    isUnlocked: () => dk != null,
    async get(key) {
      if (!isEnabled()) { try { const v = localStorage.getItem(`${DISTRO}:${key}`); return v == null ? undefined : JSON.parse(v); } catch { return undefined; } }
      return store.get(key);
    },
    async set(key, value) {
      if (!isEnabled()) { try { localStorage.setItem(`${DISTRO}:${key}`, JSON.stringify(value)); } catch {} return; }
      return store.set(key, value);
    },
    remove: (key) => isEnabled() ? store.remove(key) : (localStorage.removeItem(`${DISTRO}:${key}`), Promise.resolve()),
    keys: async () => isEnabled() ? store.keys() : Object.keys(localStorage).filter((k) => k.startsWith(`${DISTRO}:`)).map((k) => k.slice(DISTRO.length + 1)),
  };

  function setDK(next, broadcast) {
    const was = dk != null; dk = next;
    if (dk) { armIdle(); (was ? [] : unlockSubs).forEach((f) => f()); }
    else { clearTimeout(idleTimer); lockSubs.forEach((f) => f()); }
    if (broadcast && chan) chan.postMessage(dk ? 'unlocked' : 'locked');
  }
  function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(() => setDK(null, true), IDLE_MS); }
  ['click', 'keydown', 'pointermove'].forEach((ev) =>
    window.addEventListener(ev, () => { if (dk) armIdle(); }, { passive: true }));
  if (chan) chan.onmessage = (e) => { if (e.data === 'locked' && dk) setDK(null, false); };

  async function getRecord() { const r = await adapter.getRaw(META_KEY); return r || null; }
  async function migratePlaintextIn() {
    const pfx = `${DISTRO}:`, moved = [];
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(pfx) || k === ENABLED_KEY) continue;
      try { await store.set(k.slice(pfx.length), JSON.parse(localStorage.getItem(k))); moved.push(k); } catch {}
    }
    moved.forEach((k) => localStorage.removeItem(k));
  }

  flove.lock = {
    isUnlocked: () => dk != null,
    status: async () => ({ enabled: isEnabled(), unlocked: dk != null, hasVault: !!(await getRecord()) }),
    async enable(pass) {
      if (isEnabled()) throw new Error('ALREADY_ENABLED');
      const { record, dk: newDk, phrase } = await C.createVault(pass);
      await adapter.setRaw(META_KEY, record);
      setDK(newDk, false);
      await migratePlaintextIn();
      localStorage.setItem(ENABLED_KEY, '1');
      return { phrase };
    },
    async unlock(pass) {
      const rec = await getRecord(); if (!rec) throw new Error('NO_VAULT');
      setDK(await C.unlockVault(rec, pass), true);      // throws BAD_PASS
    },
    async recover(phrase) {
      const rec = await getRecord(); if (!rec) throw new Error('NO_VAULT');
      setDK(await C.recoverVault(rec, phrase), true);   // throws BAD_PHRASE
    },
    lock() { setDK(null, true); },
    async changePass(oldPass, newPass) {
      const rec = await getRecord(); const cur = await C.unlockVault(rec, oldPass); // BAD_PASS
      await adapter.setRaw(META_KEY, await C.changePass(rec, cur, newPass));
    },
    async disable(pass) {
      const rec = await getRecord(); const cur = await C.unlockVault(rec, pass);    // BAD_PASS
      dk = cur;
      for (const key of await store.keys()) {                                       // decrypt back to plaintext
        try { localStorage.setItem(`${DISTRO}:${key}`, JSON.stringify(await store.get(key))); } catch {}
        await store.remove(key);
      }
      await adapter.removeRaw(META_KEY);
      localStorage.removeItem(ENABLED_KEY);
      setDK(null, true);
    },
    onLock: (fn) => lockSubs.push(fn),
    onUnlock: (fn) => unlockSubs.push(fn),
  };

  // "Crypt on exit": the DK is already dropped on tab close (it only lives in memory);
  // data was always at-rest ciphertext. Nothing to flush.
  window.addEventListener('pagehide', () => { dk = null; });
})();
```

- [ ] **Step 2: Verify it parses**

Run: `node --check apps/flove-lock.js`
Expected: no output (exit 0).

- [ ] **Step 3: Manual browser checklist (Marc)**

State to Marc, do not automate:
1. In a scratch page that includes the three scripts: `await flove.lock.enable('pw')` returns a `{phrase}`; `flove.lock.isUnlocked()` is `true`.
2. `await flove.store.set('t', {a:1})` then reload → `await flove.lock.unlock('pw')` → `await flove.store.get('t')` is `{a:1}`; wrong pass throws `BAD_PASS`.
3. `flove.lock.recover(phrase)` unlocks after a wrong-pass lock.
4. DevTools → IndexedDB `flove-lock` shows only `{iv,ct}` blobs (no plaintext).
5. Open the page in two tabs; `flove.lock.lock()` in one locks the other within a second.

- [ ] **Step 4: Commit**

```bash
git add apps/flove-lock.js
git commit -m "feat(lock): browser glue — IndexedDB store + lock API + idle/multi-tab"
```

---

### Task 7: appy-mini — Privacy tab UI wired to `flove.lock`

**Files:**
- Modify: `apps/appy/appy-mini.html` — include scripts; un-hide `#tab-privacy` (`d-none` at ~line 1967); add the panel `#panel-privacy`; add the privacy controller JS.

**Interfaces:**
- Consumes: `window.flove.lock`, `window.flove.store`.

- [ ] **Step 1: Add the script includes** (before `</body>`, after existing scripts; order matters):

```html
<script>window.FLOVE_DISTRO_ID = window.FLOVE_DISTRO_ID || 'default';</script>
<script src="../flove-lock-wordlist.js"></script>
<script src="../flove-lock-core.js"></script>
<script src="../flove-lock.js"></script>
```

(Engineer: confirm the relative path — `appy-mini.html` is in `apps/appy/`, the lock files are in `apps/`, so `../flove-lock*.js`.)

- [ ] **Step 2: Un-hide the Privacy tab button** at ~line 1967 — remove the `d-none` class:

```html
<button type="button" class="tab-btn" role="tab" aria-selected="false" onclick="switchTab('privacy')" id="tab-privacy"><span class="en" lang="en">Privacy</span><span class="es" lang="es">Privacidad</span></button>
```

- [ ] **Step 3: Add the Privacy panel** (mirror the markup pattern of the other `switchTab` panels; place beside them). All copy bilingual, **no inline `style=`** — use existing utility classes (`d-flex`, `gap-9`, `mt-12`, `btn`, `ghost`, `muted`, `fz-*`) seen in the Settings block:

```html
<div id="panel-privacy" class="tab-panel d-none" role="tabpanel" aria-labelledby="tab-privacy">
  <div class="flove-lock-ui">
    <p class="muted fz-72"><span class="en" lang="en">Encrypt everything this distro stores on your device. <b>At-rest only</b> — not unbreakable. Lose the pass and the recovery phrase and the data is gone.</span><span class="es" lang="es">Cifra todo lo que esta distro guarda en tu dispositivo. <b>Solo en reposo</b> — no es indescifrable. Si pierdes la contraseña y la frase de recuperación, los datos se pierden.</span></p>

    <!-- ENABLE (shown when not enabled) -->
    <div id="lock-enable-box" class="d-flex flex-col gap-9 mt-12">
      <label class="fz-72"><span class="en" lang="en">Create a password</span><span class="es" lang="es">Crea una contraseña</span></label>
      <input id="lock-pass" type="password" class="lock-pass" autocomplete="new-password" placeholder="…" data-ph-en="your crypter pass" data-ph-es="tu contraseña de cifrado">
      <div class="d-flex gap-9">
        <button type="button" id="lock-pass-gen" class="btn ghost" data-aria-en="Generate a password" data-aria-es="Generar una contraseña"><span class="en" lang="en">⟳ Generate</span><span class="es" lang="es">⟳ Generar</span></button>
        <button type="button" id="lock-pass-copy" class="btn ghost" data-aria-en="Copy the password" data-aria-es="Copiar la contraseña"><span class="en" lang="en">⧉ Copy</span><span class="es" lang="es">⧉ Copiar</span></button>
      </div>
      <button type="button" id="lock-enable" class="btn signal"><span class="en" lang="en">🔒 Enable login</span><span class="es" lang="es">🔒 Activar acceso</span></button>
    </div>

    <!-- RECOVERY PHRASE (shown once after enable) -->
    <div id="lock-phrase-box" class="d-none mt-12">
      <p class="fz-72"><span class="en" lang="en">Write down your recovery phrase — it is the only way back if you forget the password:</span><span class="es" lang="es">Anota tu frase de recuperación — es la única vuelta si olvidas la contraseña:</span></p>
      <code id="lock-phrase" class="lock-phrase"></code>
      <button type="button" id="lock-phrase-ok" class="btn signal mt-12"><span class="en" lang="en">I saved it</span><span class="es" lang="es">La he guardado</span></button>
    </div>

    <!-- ENABLED CONTROLS (shown when enabled) -->
    <div id="lock-manage-box" class="d-none mt-12 d-flex flex-col gap-9">
      <p id="lock-state" class="fz-72 muted" aria-live="polite"></p>
      <button type="button" id="lock-unlock" class="btn ghost d-none"><span class="en" lang="en">Unlock</span><span class="es" lang="es">Desbloquear</span></button>
      <button type="button" id="lock-now" class="btn ghost"><span class="en" lang="en">Lock now</span><span class="es" lang="es">Bloquear ahora</span></button>
      <button type="button" id="lock-crypt-exit" class="btn ghost" aria-pressed="true" data-aria-en="Crypt on exit" data-aria-es="Cifrar al salir"><span class="en" lang="en">Crypt on exit: on</span><span class="es" lang="es">Cifrar al salir: sí</span></button>
      <small class="muted fz-62"><span class="en" lang="en">Leave all encrypted when you close, add the password to decrypt it.</span><span class="es" lang="es">Deja todo cifrado al cerrar; añade la contraseña para descifrarlo.</span></small>
      <button type="button" id="lock-change" class="btn ghost"><span class="en" lang="en">Change crypter pass</span><span class="es" lang="es">Cambiar contraseña de cifrado</span></button>
      <button type="button" id="lock-forgot" class="btn ghost"><span class="en" lang="en">Forgot password → recovery phrase</span><span class="es" lang="es">Olvidé la contraseña → frase de recuperación</span></button>
      <button type="button" id="lock-disable" class="btn ghost"><span class="en" lang="en">Disable login (decrypt back)</span><span class="es" lang="es">Desactivar acceso (descifrar de vuelta)</span></button>
    </div>
    <p id="lock-msg" class="fz-62 mt-4" aria-live="polite"></p>
  </div>
</div>
```

- [ ] **Step 4: Add the controller JS** (in the page's main `<script>`; uses only `window.flove.lock`):

```js
(function lockUI() {
  const $ = (id) => document.getElementById(id);
  const show = (el, on) => el && el.classList.toggle('d-none', !on);
  const msg = (t) => { const m = $('lock-msg'); if (m) m.textContent = t || ''; };
  function genPass() {
    const w = (window.flove && window.flove.lockWords) || [];
    const pick = () => w[Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * w.length)];
    return [pick(), pick(), pick(), pick()].join('-');
  }
  async function refresh() {
    if (!window.flove || !window.flove.lock) return;
    const s = await window.flove.lock.status();
    show($('lock-enable-box'), !s.enabled);
    show($('lock-manage-box'), s.enabled);
    show($('lock-unlock'), s.enabled && !s.unlocked);
    show($('lock-now'), s.enabled && s.unlocked);
    const st = $('lock-state');
    if (st) st.textContent = s.unlocked
      ? (document.documentElement.lang === 'es' ? 'Desbloqueado' : 'Unlocked')
      : (document.documentElement.lang === 'es' ? 'Bloqueado' : 'Locked');
  }
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t || !window.flove?.lock) return;
    try {
      if (t.id === 'lock-pass-gen') { $('lock-pass').value = genPass(); }
      else if (t.id === 'lock-pass-copy') { await navigator.clipboard.writeText($('lock-pass').value || ''); msg('Copied'); }
      else if (t.id === 'lock-enable') {
        const pw = $('lock-pass').value.trim(); if (!pw) return msg('Enter a password');
        const { phrase } = await window.flove.lock.enable(pw);
        $('lock-phrase').textContent = phrase; show($('lock-enable-box'), false); show($('lock-phrase-box'), true);
      }
      else if (t.id === 'lock-phrase-ok') { show($('lock-phrase-box'), false); await refresh(); }
      else if (t.id === 'lock-unlock') { const pw = prompt('Password'); if (pw) { await window.flove.lock.unlock(pw); await refresh(); } }
      else if (t.id === 'lock-now') { window.flove.lock.lock(); await refresh(); }
      else if (t.id === 'lock-change') { const o = prompt('Current pass'); const n = prompt('New pass'); if (o && n) { await window.flove.lock.changePass(o, n); msg('Changed'); } }
      else if (t.id === 'lock-forgot') { const p = prompt('Recovery phrase'); if (p) { await window.flove.lock.recover(p); await refresh(); } }
      else if (t.id === 'lock-disable') { const pw = prompt('Password to disable'); if (pw) { await window.flove.lock.disable(pw); await refresh(); } }
    } catch (err) { msg(err.message); }
  });
  window.flove?.lock?.onLock(refresh); window.flove?.lock?.onUnlock(refresh);
  document.addEventListener('DOMContentLoaded', refresh); refresh();
})();
```

(Engineer: `switchTab('privacy')` must reveal `#panel-privacy` — confirm `switchTab` at line 2834 toggles `d-none`/`aria-selected` on `#panel-<name>` by id convention; if it uses a different panel-id pattern, match it.)

- [ ] **Step 5: Gate the file**

```bash
npx --no-install html-validate apps/appy/appy-mini.html        # expect 0 errors
node ~/.claude/skills/translate2/scripts/check.js apps/appy/appy-mini.html   # expect OK
grep -c 'Ã\|Â' apps/appy/appy-mini.html                        # expect 0
```

- [ ] **Step 6: Commit**

```bash
git add apps/appy/appy-mini.html
git commit -m "feat(lock): appy-mini Privacy tab — Enable login UI wired to flove.lock"
```

---

### Task 8: appy-basic — same Privacy tab UI

**Files:**
- Modify: `apps/appy/appy-basic.html` (Privacy tab `d-none` at ~line 1952; Settings ~line 2073)

**Interfaces:**
- Consumes: identical to Task 7.

- [ ] **Step 1:** Apply Task 7 Steps 1–4 verbatim to `apps/appy/appy-basic.html` (same script includes, un-hide the `#tab-privacy` button at ~line 1952, add the identical `#panel-privacy` block and the same `lockUI()` controller). The markup/JS are identical — copy them exactly (do not paraphrase).
- [ ] **Step 2: Gate**

```bash
npx --no-install html-validate apps/appy/appy-basic.html        # 0 errors
node ~/.claude/skills/translate2/scripts/check.js apps/appy/appy-basic.html   # OK
grep -c 'Ã\|Â' apps/appy/appy-basic.html                        # 0
```

- [ ] **Step 3: Commit**

```bash
git add apps/appy/appy-basic.html
git commit -m "feat(lock): appy-basic Privacy tab — Enable login UI"
```

---

### Task 9: Full-suite run + board/docs note

**Files:**
- Modify: `docs/skills-applied.html` (or the relevant tracking note) — record the add-on shipped.

- [ ] **Step 1: Run the whole test suite**

Run: `node --test tests/`
Expected: PASS (all crypto/store tests across Tasks 1–5).

- [ ] **Step 2: Re-gate both UI files** (as Tasks 7/8 Step 5) — confirm 0 / OK / 0 for each.

- [ ] **Step 3: Add a one-line note** to `docs/skills-applied.html` (or wherever the F0 roadmap status lives) that the §13.13 High demo add-on shipped (scripts `apps/flove-lock*.js`, surfaced in appy-mini/appy-basic Privacy tab), pointing to the spec.

- [ ] **Step 4: Commit + push**

```bash
git add docs/skills-applied.html
git commit -m "docs: record §13.13 High locking add-on shipped (F0/F1)"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- §2/§4 shared flove.js lock/store layer → Tasks 5 (store logic), 6 (browser glue + IndexedDB + passthrough + migration). ✓
- §4 in-memory data key, locked sentinel → Task 5 (`LOCKED`), Task 6 (`setDK`). ✓
- §4.1 distroId namespacing/isolation → Task 5 (namespace + isolation test), Task 6 (`window.FLOVE_DISTRO_ID`). ✓
- §5 PBKDF2 KEK → wrapped DK, recovery phrase → Tasks 1,2,3,4. ✓
- §6 appy Privacy-tab UX (enable / create-or-generate pass / Enable / crypt-on-exit / change pass / forgot→phrase / disable / lock-unlock) → Tasks 7,8. ✓
- §6 multi-tab sync → Task 6 (`BroadcastChannel`). ✓ idle timeout → Task 6 (`IDLE_MS`). ✓
- §6 plaintext→ciphertext migration → Task 6 (`migratePlaintextIn`). ✓
- Threat-model honesty copy → Task 7 panel text. ✓
- Deferred multiuser-pack mechanics → not implemented (correct; `distroId` defaults to `'default'`). ✓

**Placeholder scan:** The only intentional gap is the **256-word list** content (Task 3 ships a starter list with a flagged `foct` placeholder + an enforced 256/unique test gate) — the engineer must finalize it to exactly 256 unique words; the test fails until they do, so it cannot ship broken. No `TODO`/"handle errors"/vague steps elsewhere; every code step shows complete code.

**Type consistency:** `createVault`→`{record,dk,phrase}` consumed identically in Tasks 4-test and 6 (`enable`). `unlockVault`/`recoverVault`→`CryptoKey` fed to `setDK`. `makeStore(adapter, getDK, distroId)` signature identical in Task 5 tests and Task 6. `LOCKED` symbol defined Task 5, returned by `store.get` and surfaced as passthrough/sentinel. Vault record fields (`kdf.salt`, `recKdf.salt`, `pass`, `rec`, `verify`) written in `createVault` and read in `unlock`/`recover`/`changePass` — consistent.

**Note on TDD vs flove reality:** Tasks 1–5 (pure crypto/store) are full TDD with `node:test`. Tasks 6–8 are browser/DOM code with **no automation available** (CLAUDE.md §5), so they are gated by `node --check` + `html-validate` + the translate2 gate + an explicit manual checklist for Marc — the honest substitute for unit tests on un-automatable UI.
