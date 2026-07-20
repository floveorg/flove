# Banco de la risa — Phase 1 (Telegram bot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A serverless Telegram moderation bot — people DM their laugh to **@RisaLiberadaBot**, moderators approve/reject it in the private group **"Risas Nuevas"** with ✅/🗑 buttons, and approved clips are published (into `banco.json` + `audio/` served by GitHub Pages, which the Risa Liberada web page already reads, and posted to the public channel **t.me/risaliberada**).

**Architecture:** No server. A **GitHub Actions cron** (every ~10 min) runs a zero-dependency **Node** script in a dedicated repo **`floveorg/banco-risa`**. Each run: reads the saved Telegram update offset, calls the Bot API (`getUpdates`), turns updates into a list of actions (pure, tested logic), applies them (download voice → `ffmpeg` mp3 → prepend `banco.json` → post to channel → edit the mod message), then commits the changed files. GitHub Pages serves `banco.json` + `audio/` for the website.

**Tech Stack:** Node ≥20 (global `fetch`, no libraries), `ffmpeg` (preinstalled on the runner), Telegram Bot API over HTTPS, GitHub Actions + GitHub Pages. Tests: Node's built-in `node --test`.

> **Amendment 2026-07-19 — audio on Cloudinary (Marc):** the community-uploaded laugh clips are uploaded to **Cloudinary** (zero-dep signed upload, `bot/cloudinary.mjs`), NOT committed to git. `banco.json` keeps only metadata; each entry's `src` is the Cloudinary `secure_url`. `bancoEntry` now takes `src` directly (no `pagesBase`/`audio/` path). `poll.mjs` approve branch: download → ffmpeg loudnorm → upload to Cloudinary → prepend `banco.json` → post to channel **by URL**; temp files in `os.tmpdir()`. The `audio/` dir is dropped from the repo. New secret **`CLOUDINARY_URL`** (`cloudinary://key:secret@cloud`) alongside `TELEGRAM_BOT_TOKEN` (Task 6). Workflow commits only `banco.json` + `state/`. Tasks 3, 5, 6, 8 below reflect the pre-amendment repo-audio design; the implemented code follows this amendment.

## Global Constraints

- **All work is in the NEW repo `floveorg/banco-risa`**, EXCEPT Task 7 which makes a one-line change in the existing flove repo (`~/Documents/flove`).
- **Zero runtime dependencies.** Use global `fetch` and `node:child_process` for ffmpeg. No npm install. Tests use only `node:test`/`node:assert`.
- **The bot token is a SECRET.** It lives only as the GitHub Actions secret `TELEGRAM_BOT_TOKEN` (added manually in the GitHub UI — see Task 6). Never commit it, never print it, never pass it on a command line that gets logged. Locally it is read from `~/Claude/token-telegram-risa.md` only when needed and only into an env var.
- **`banco.json` data contract (from the spec §4, reconciled):** each published entry is `{ id, name, src, t?, tags?, when }` where `name` is the display name, `src` is the **absolute** Pages URL of the mp3, `when` is ISO date. The bot writes `name` (NOT a pre-composed `by`) and **prepends** (newest-first). The website composes the license itself.
- **Absolute audio URLs.** Because the website (flove.org origin) reads `banco.json` from the banco-risa Pages origin, every `src` must be a full URL: `https://floveorg.github.io/banco-risa/audio/<id>.mp3`.
- **License:** `CC BY-SA 4.0`. The bot states it to the uploader before/on accepting.
- **Idempotency:** the offset is advanced only after a successful commit; actions key off a stable `id` so a reprocessed update is a no-op.
- **Config (non-secret) lives in `config.json`:** `modGroupId`, `channel` (`@risaliberada`), `botUsername`, `pagesBase`. Chat IDs are not secrets.
- **Commits** in banco-risa use a plain author; the flove-repo change in Task 7 keeps the flove convention (scoped add, `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer).

---

### Task 1: Bootstrap the `floveorg/banco-risa` repo + scaffold

**Files (created locally in a fresh clone, then pushed):**
- Create: `README.md`, `config.json`, `banco.json`, `state/offset.txt`, `state/queue.json`, `audio/.gitkeep`, `.gitignore`

**Interfaces:**
- Produces: the repo, cloned at `~/banco-risa`, with empty data files the later tasks fill. `config.json` shape: `{ "botUsername": "RisaLiberadaBot", "channel": "@risaliberada", "modGroupId": null, "pagesBase": "https://floveorg.github.io/banco-risa" }` (`modGroupId` filled in Task 6).

- [ ] **Step 1: Create the repo via the GitHub API** (outward action — confirm with the human first)

```bash
TOKEN=$(tr -d ' \n' < <(grep -oE 'gh[po]_[A-Za-z0-9]+' ~/Claude/token-github-flove.md))
curl -sS -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"name":"banco-risa","description":"Banco de la risa — Telegram moderation bot + public clips for Risa Liberada","private":false,"has_issues":false,"has_wiki":false}' \
  -o /dev/null -w "create: HTTP %{http_code}\n"
```
Expected: `HTTP 201`. (If the grep finds no token, open `~/Claude/token-github-flove.md`, read the PAT, and set `TOKEN` manually — do not echo it.)

- [ ] **Step 2: Clone it and add scaffolding**

```bash
cd ~ && git clone "https://floveorg:$TOKEN@github.com/floveorg/banco-risa.git" ~/banco-risa
cd ~/banco-risa
printf '[]\n' > banco.json
mkdir -p state audio bot/test
printf '0\n' > state/offset.txt
printf '{}\n' > state/queue.json
touch audio/.gitkeep
printf 'node_modules/\n*.log\n' > .gitignore
cat > config.json <<'JSON'
{
  "botUsername": "RisaLiberadaBot",
  "channel": "@risaliberada",
  "modGroupId": null,
  "pagesBase": "https://floveorg.github.io/banco-risa"
}
JSON
cat > README.md <<'MD'
# Banco de la risa — bot

Serverless Telegram moderation bot for [Risa Liberada](https://flove.org). People DM their
laugh to **@RisaLiberadaBot**; moderators approve/reject in the private group *Risas Nuevas*;
approved clips land in `banco.json` + `audio/` (served by GitHub Pages) and the public channel
[t.me/risaliberada](https://t.me/risaliberada). Runs on a GitHub Actions cron — no server.

- `bot/logic.mjs` — pure update→actions logic (tested)
- `bot/telegram.mjs` — thin Bot API client
- `bot/poll.mjs` — orchestrator run each cron tick
- `.github/workflows/poll.yml` — the cron
- Data: `banco.json` (published clips, newest-first), `audio/*.mp3`, `state/` (offset + pending queue)

License of published clips: **CC BY-SA 4.0**.
MD
git add -A && git commit -q -m "chore: scaffold banco-risa (config, empty data, README)" && git push -q origin HEAD
echo "scaffolded + pushed"
```
Expected: clone succeeds, commit + push OK.

- [ ] **Step 3: Commit** — already done in Step 2 (the scaffold is one logical unit).

---

### Task 2: Pure logic — `parseUpdates` (TDD)

**Files:**
- Create: `bot/logic.mjs`
- Test: `bot/test/logic.test.mjs`

**Interfaces:**
- Produces `parseUpdates(updates, ctx) -> { actions, offset }` where `ctx = { modGroupId }`.
  - `updates`: the array from Telegram `getUpdates`.
  - `offset`: `max(update_id)+1` over the batch (or the passed-in current offset if empty).
  - `actions`: ordered list, each one of:
    - `{ kind:'ingest', id, fromChatId, fromMsgId, name, tags, uploaderChatId }` — a voice/audio message in a **private** chat.
    - `{ kind:'approve', id, callbackId, modMsgId }` — a `callback_query` with data `ok:<id>` from the mod group.
    - `{ kind:'reject', id, callbackId, modMsgId }` — a `callback_query` with data `no:<id>` from the mod group.
  - Non-matching updates (text, other chats, non-audio) are ignored.
- Consumed by `poll.mjs` (Task 5).

- [ ] **Step 1: Write the failing tests** — `bot/test/logic.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUpdates } from '../logic.mjs';

const CTX = { modGroupId: -1001234 };

test('a private voice message becomes an ingest action', () => {
  const updates = [{
    update_id: 10,
    message: { message_id: 5, chat: { id: 777, type: 'private' },
      from: { first_name: 'Marta' }, voice: { file_id: 'AAA', duration: 3 } }
  }];
  const { actions, offset } = parseUpdates(updates, CTX);
  assert.equal(offset, 11);
  assert.equal(actions.length, 1);
  assert.deepEqual(actions[0], {
    kind: 'ingest', id: 'q_10', fromChatId: 777, fromMsgId: 5,
    name: 'Marta', tags: '', uploaderChatId: 777
  });
});

test('an audio message with a caption carries the caption as tags', () => {
  const updates = [{
    update_id: 12,
    message: { message_id: 6, chat: { id: 888, type: 'private' },
      from: { first_name: 'Yusuf' }, audio: { file_id: 'BBB' }, caption: 'de vientre' }
  }];
  const { actions } = parseUpdates(updates, CTX);
  assert.equal(actions[0].kind, 'ingest');
  assert.equal(actions[0].tags, 'de vientre');
  assert.equal(actions[0].id, 'q_12');
});

test('approve/reject callbacks from the mod group are parsed', () => {
  const updates = [
    { update_id: 20, callback_query: { id: 'cb1', data: 'ok:q_10',
      message: { message_id: 99, chat: { id: -1001234 } } } },
    { update_id: 21, callback_query: { id: 'cb2', data: 'no:q_12',
      message: { message_id: 98, chat: { id: -1001234 } } } },
  ];
  const { actions, offset } = parseUpdates(updates, CTX);
  assert.equal(offset, 22);
  assert.deepEqual(actions[0], { kind:'approve', id:'q_10', callbackId:'cb1', modMsgId:99 });
  assert.deepEqual(actions[1], { kind:'reject',  id:'q_12', callbackId:'cb2', modMsgId:98 });
});

test('callbacks from other chats and non-audio messages are ignored', () => {
  const updates = [
    { update_id: 30, callback_query: { id:'x', data:'ok:q_1', message:{ message_id:1, chat:{ id: 999 } } } },
    { update_id: 31, message: { message_id: 7, chat:{ id: 5, type:'private' }, from:{ first_name:'A' }, text: 'hola' } },
  ];
  const { actions, offset } = parseUpdates(updates, CTX);
  assert.equal(actions.length, 0);
  assert.equal(offset, 32);
});

test('empty batch keeps the current offset', () => {
  assert.deepEqual(parseUpdates([], CTX, 500), { actions: [], offset: 500 });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd ~/banco-risa && node --test bot/test/logic.test.mjs`
Expected: FAIL — `Cannot find module '../logic.mjs'`.

- [ ] **Step 3: Implement `bot/logic.mjs`**

```js
// Pure logic: Telegram getUpdates -> ordered actions + new offset. No I/O.

export function parseUpdates(updates, ctx, currentOffset = 0) {
  const actions = [];
  let maxId = -1;
  for (const u of updates) {
    if (typeof u.update_id === 'number') maxId = Math.max(maxId, u.update_id);

    const cb = u.callback_query;
    if (cb && cb.message && cb.message.chat && cb.message.chat.id === ctx.modGroupId) {
      const m = /^(ok|no):(.+)$/.exec(cb.data || '');
      if (m) {
        actions.push({
          kind: m[1] === 'ok' ? 'approve' : 'reject',
          id: m[2], callbackId: cb.id, modMsgId: cb.message.message_id
        });
      }
      continue;
    }

    const msg = u.message;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const media = msg.voice || msg.audio;
      if (media && media.file_id) {
        actions.push({
          kind: 'ingest', id: 'q_' + u.update_id,
          fromChatId: msg.chat.id, fromMsgId: msg.message_id,
          name: (msg.from && msg.from.first_name) || 'Anónima',
          tags: (msg.caption || '').trim(),
          uploaderChatId: msg.chat.id
        });
      }
    }
  }
  const offset = maxId >= 0 ? maxId + 1 : currentOffset;
  return { actions, offset };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd ~/banco-risa && node --test bot/test/logic.test.mjs`
Expected: PASS — 5 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
cd ~/banco-risa && git add bot/logic.mjs bot/test/logic.test.mjs
git commit -q -m "feat: parseUpdates — pure Telegram update->actions logic + tests"
```

---

### Task 3: Pure logic — `bancoEntry` + `prependClip` (TDD)

**Files:**
- Modify: `bot/logic.mjs`
- Test: `bot/test/banco.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces (added to `logic.mjs`):
  - `bancoEntry({ id, name, tags, when, pagesBase }) -> { id, name, src, tags?, when }` — builds a published entry; `src = pagesBase + '/audio/' + id + '.mp3'`; omits `tags` when empty.
  - `prependClip(banco, entry) -> Array` — returns a NEW array with `entry` first (newest-first), unchanged input.

- [ ] **Step 1: Write the failing tests** — `bot/test/banco.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bancoEntry, prependClip } from '../logic.mjs';

const BASE = 'https://floveorg.github.io/banco-risa';

test('bancoEntry builds absolute src and keeps name (no by field)', () => {
  const e = bancoEntry({ id: 'q_10', name: 'Marta', tags: 'de grupo', when: '2026-07-19', pagesBase: BASE });
  assert.deepEqual(e, {
    id: 'q_10', name: 'Marta',
    src: 'https://floveorg.github.io/banco-risa/audio/q_10.mp3',
    tags: 'de grupo', when: '2026-07-19'
  });
  assert.equal('by' in e, false);
});

test('bancoEntry omits tags when empty', () => {
  const e = bancoEntry({ id: 'q_11', name: 'Yusuf', tags: '', when: '2026-07-19', pagesBase: BASE });
  assert.equal('tags' in e, false);
});

test('prependClip puts the new clip first and does not mutate input', () => {
  const banco = [{ id: 'old' }];
  const out = prependClip(banco, { id: 'new' });
  assert.deepEqual(out.map(x => x.id), ['new', 'old']);
  assert.deepEqual(banco.map(x => x.id), ['old']); // unchanged
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd ~/banco-risa && node --test bot/test/banco.test.mjs`
Expected: FAIL — `bancoEntry` / `prependClip` are not exported.

- [ ] **Step 3: Append to `bot/logic.mjs`**

```js
export function bancoEntry({ id, name, tags, when, pagesBase }) {
  const e = {
    id,
    name: name || 'Anónima',
    src: pagesBase + '/audio/' + id + '.mp3',
    when
  };
  if (tags) e.tags = tags;
  return e;
}

export function prependClip(banco, entry) {
  return [entry, ...(Array.isArray(banco) ? banco : [])];
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd ~/banco-risa && node --test bot/test/banco.test.mjs`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
cd ~/banco-risa && git add bot/logic.mjs bot/test/banco.test.mjs
git commit -q -m "feat: bancoEntry + prependClip (newest-first, absolute src) + tests"
```

---

### Task 4: Telegram API client — `bot/telegram.mjs`

**Files:**
- Create: `bot/telegram.mjs`

**Interfaces:**
- Consumes: `TELEGRAM_BOT_TOKEN` from the environment.
- Produces a `Telegram(token)` factory returning methods used by `poll.mjs`:
  - `getUpdates(offset)`, `copyMessage(chatId, fromChatId, messageId, replyMarkup)`, `sendMessage(chatId, text)`, `sendAudioByPath(chatId, filePath, caption)`, `answerCallback(id, text)`, `editReplyMarkupClear(chatId, messageId)`, `editCaption(chatId, messageId, caption)`, `getFilePath(fileId)`, `downloadFile(filePath, destPath)`.
- Thin wrappers over `https://api.telegram.org/bot<token>/<method>`; no ret/queue logic (that's the orchestrator's job).

- [ ] **Step 1: Implement** (no unit test — it is I/O glue, exercised by the Task 8 dry run)

```js
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export function Telegram(token) {
  const api = 'https://api.telegram.org/bot' + token + '/';
  const file = 'https://api.telegram.org/file/bot' + token + '/';

  async function call(method, body) {
    const res = await fetch(api + method, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    const json = await res.json();
    if (!json.ok) throw new Error(method + ' failed: ' + JSON.stringify(json));
    return json.result;
  }

  return {
    getUpdates: (offset) =>
      call('getUpdates', { offset, timeout: 0, allowed_updates: ['message', 'callback_query'] }),
    copyMessage: (chatId, fromChatId, messageId, replyMarkup) =>
      call('copyMessage', { chat_id: chatId, from_chat_id: fromChatId,
        message_id: messageId, reply_markup: replyMarkup }),
    sendMessage: (chatId, text) => call('sendMessage', { chat_id: chatId, text }),
    answerCallback: (id, text) => call('answerCallbackQuery', { callback_query_id: id, text }),
    editReplyMarkupClear: (chatId, messageId) =>
      call('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
    editCaption: (chatId, messageId, caption) =>
      call('editMessageCaption', { chat_id: chatId, message_id: messageId, caption }),
    getFilePath: async (fileId) => (await call('getFile', { file_id: fileId })).file_path,

    async downloadFile(filePath, destPath) {
      const res = await fetch(file + filePath);
      if (!res.ok) throw new Error('download failed: ' + res.status);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
    },

    async sendAudioByPath(chatId, filePath, caption) {
      const { readFile } = await import('node:fs/promises');
      const buf = await readFile(filePath);
      const form = new FormData();
      form.append('chat_id', String(chatId));
      if (caption) form.append('caption', caption);
      form.append('audio', new Blob([buf], { type: 'audio/mpeg' }), filePath.split('/').pop());
      const res = await fetch(api + 'sendAudio', { method: 'POST', body: form });
      const json = await res.json();
      if (!json.ok) throw new Error('sendAudio failed: ' + JSON.stringify(json));
      return json.result;
    }
  };
}
```

- [ ] **Step 2: Syntax-check and commit**

Run: `cd ~/banco-risa && node --check bot/telegram.mjs && echo OK`
Expected: `OK`

```bash
cd ~/banco-risa && git add bot/telegram.mjs
git commit -q -m "feat: thin Telegram Bot API client"
```

---

### Task 5: Orchestrator — `bot/poll.mjs`

**Files:**
- Create: `bot/poll.mjs`

**Interfaces:**
- Consumes: `parseUpdates`, `bancoEntry`, `prependClip` (logic.mjs); `Telegram` (telegram.mjs); `config.json`; env `TELEGRAM_BOT_TOKEN`; files `state/offset.txt`, `state/queue.json`, `banco.json`, `audio/`.
- Produces: the run entrypoint executed by the workflow. Reads state, fetches updates, applies actions, writes state + data. Does NOT commit (the workflow commits).
- Queue (`state/queue.json`): `{ [id]: { fileId, name, tags, uploaderChatId, modMsgId } }`.

- [ ] **Step 1: Implement**

```js
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseUpdates, bancoEntry, prependClip } from './logic.mjs';
import { Telegram } from './telegram.mjs';

const run = promisify(execFile);
const ROOT = new URL('..', import.meta.url).pathname;
const p = (rel) => ROOT + rel;

const readJSON = async (rel, fallback) => {
  try { return JSON.parse(await readFile(p(rel), 'utf8')); } catch { return fallback; }
};
const writeJSON = (rel, v) => writeFile(p(rel), JSON.stringify(v, null, 2) + '\n');
const isoToday = () => new Date().toISOString().slice(0, 10);

const BUTTONS = (id) => ({ inline_keyboard: [[
  { text: '✅ Publicar', callback_data: 'ok:' + id },
  { text: '🗑 Borrar',   callback_data: 'no:' + id }
]] });

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const cfg = await readJSON('config.json', {});
  if (!cfg.modGroupId) throw new Error('config.json modGroupId not set (run Task 6)');
  const tg = Telegram(token);

  const offset = parseInt(await readFile(p('state/offset.txt'), 'utf8'), 10) || 0;
  const queue = await readJSON('state/queue.json', {});
  let banco = await readJSON('banco.json', []);

  const updates = await tg.getUpdates(offset);
  const { actions, offset: nextOffset } = parseUpdates(updates, { modGroupId: cfg.modGroupId }, offset);

  for (const a of actions) {
    try {
      if (a.kind === 'ingest') {
        // copy the audio into the mod group with the approve/reject buttons
        const copied = await tg.copyMessage(cfg.modGroupId, a.fromChatId, a.fromMsgId, BUTTONS(a.id));
        queue[a.id] = { fileId: null, name: a.name, tags: a.tags,
                        uploaderChatId: a.uploaderChatId, modMsgId: copied.message_id,
                        fromChatId: a.fromChatId, fromMsgId: a.fromMsgId };
        await tg.sendMessage(a.uploaderChatId,
          '¡Recibida! 💛 Un par de moderadores la revisan; si entra, sonará en el banco. ' +
          'Al enviarla la publicas en libre, bajo CC BY-SA 4.0.');
      } else if (a.kind === 'approve') {
        const q = queue[a.id];
        await tg.answerCallback(a.callbackId, q ? 'Publicando…' : 'Ya resuelta');
        if (!q) continue;
        // re-fetch the original message's file via getUpdates is not possible; we stored fromChat/fromMsg,
        // but file_id is only in the original update. Instead we re-copy is unnecessary: download via the
        // copied message is not exposed, so we resolve the file from the original by re-reading it:
        // Telegram guarantees file_id stability — capture it at ingest time (see NOTE below). For MVP we
        // stored fromChatId/fromMsgId; fetch the file_id now with getChat is not available, so ingest MUST
        // persist file_id. This branch expects q.fileId to be set at ingest.
        if (!q.fileId) throw new Error('queue entry missing fileId for ' + a.id);
        const src = await tg.getFilePath(q.fileId);
        const oga = p('audio/' + a.id + '.oga');
        const mp3 = p('audio/' + a.id + '.mp3');
        await tg.downloadFile(src, oga);
        await run('ffmpeg', ['-y', '-i', oga, '-af', 'loudnorm', '-codec:a', 'libmp3lame', '-q:a', '4', mp3]);
        await run('rm', ['-f', oga]);
        banco = prependClip(banco, bancoEntry({ id: a.id, name: q.name, tags: q.tags, when: isoToday(), pagesBase: cfg.pagesBase }));
        await tg.sendAudioByPath(cfg.channel, mp3, q.name + ' · CC BY-SA 4.0');
        await tg.editReplyMarkupClear(cfg.modGroupId, q.modMsgId);
        await tg.editCaption(cfg.modGroupId, q.modMsgId, '✅ Publicado');
        delete queue[a.id];
      } else if (a.kind === 'reject') {
        const q = queue[a.id];
        await tg.answerCallback(a.callbackId, 'Borrada');
        if (q) { await tg.editReplyMarkupClear(cfg.modGroupId, q.modMsgId);
                 await tg.editCaption(cfg.modGroupId, q.modMsgId, '🗑 Borrada'); delete queue[a.id]; }
      }
    } catch (err) {
      console.error('action failed', a.id, a.kind, err.message); // leave in queue; do not advance past it
    }
  }

  await writeJSON('state/queue.json', queue);
  await writeJSON('banco.json', banco);
  await writeFile(p('state/offset.txt'), String(nextOffset) + '\n');
  console.log(`processed ${actions.length} action(s); offset ${offset} -> ${nextOffset}; banco ${banco.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**NOTE for the implementer:** the approve branch needs `q.fileId`, so the ingest branch must persist it. Telegram puts the `file_id` on the original `voice`/`audio` object — `parseUpdates` (Task 2) already has access to it but the current `ingest` action does not carry it. **Fix as part of this task:** add `fileId` to the `ingest` action in `logic.mjs` (`fileId: media.file_id`) and its Task-2 test, and set `queue[a.id].fileId = a.fileId` here. Re-run the Task 2 tests after the change.

- [ ] **Step 2: Add `fileId` to the ingest action**

In `bot/logic.mjs`, in the ingest push, add `fileId: media.file_id,`. In `bot/test/logic.test.mjs`, extend the first two tests' expected objects with `fileId: 'AAA'` / `fileId: 'BBB'`. Run: `cd ~/banco-risa && node --test bot/test/logic.test.mjs` → PASS.

- [ ] **Step 3: Syntax-check and commit**

Run: `cd ~/banco-risa && node --check bot/poll.mjs && echo OK`
```bash
cd ~/banco-risa && git add bot/poll.mjs bot/logic.mjs bot/test/logic.test.mjs
git commit -q -m "feat: poll.mjs orchestrator (ingest->queue, approve/reject, ffmpeg publish)"
```

---

### Task 6: Secret, moderators' group chat ID, and Pages

**Files:**
- Modify: `config.json`

- [ ] **Step 1: Add the bot token as an Actions secret (MANUAL — human does this in the browser)**

Tell the human: go to `https://github.com/floveorg/banco-risa/settings/secrets/actions` → **New repository secret** → name `TELEGRAM_BOT_TOKEN`, value = the token from `~/Claude/token-telegram-risa.md`. This keeps the token out of every command and transcript.

- [ ] **Step 2: Discover the moderators' group chat ID**

Ask the human to send any message in the **"Risas Nuevas"** group (so the bot sees it). Then, reading the token locally into an env var (never printed):

```bash
TG=$(grep -oE '[0-9]{6,}:[A-Za-z0-9_-]{30,}' ~/Claude/token-telegram-risa.md)
curl -s "https://api.telegram.org/bot$TG/getUpdates" | \
  node -e 'const u=JSON.parse(require("fs").readFileSync(0));const g=u.result.map(x=>x.message&&x.message.chat).filter(c=>c&&(c.type==="group"||c.type==="supergroup"));console.log(g.map(c=>c.id+" "+c.title).join("\n")||"(no group messages seen yet)")'
```
Take the negative id for "Risas Nuevas" and put it in `config.json` as `modGroupId` (a number, not a string).

- [ ] **Step 3: Enable GitHub Pages (serve `banco.json` + `audio/` from root of `main`)**

```bash
TOKEN=$(grep -oE 'gh[po]_[A-Za-z0-9]+' ~/Claude/token-github-flove.md)
curl -sS -X POST https://api.github.com/repos/floveorg/banco-risa/pages \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  -d '{"source":{"branch":"main","path":"/"}}' -o /dev/null -w "pages: HTTP %{http_code}\n"
```
Expected: `HTTP 201` (or `409` if already enabled). Verify after a minute: `curl -s -o /dev/null -w "%{http_code}\n" https://floveorg.github.io/banco-risa/banco.json` → `200`.

- [ ] **Step 4: Commit the config**

```bash
cd ~/banco-risa && git add config.json
git commit -q -m "chore: set modGroupId for Risas Nuevas" && git push -q origin HEAD
```

---

### Task 7: Point the website at the live banco (flove repo)

**Files:**
- Modify: `~/Documents/flove/apps/liberada/risa/banco.js`
- Delete: `~/Documents/flove/apps/liberada/risa/banco.json` (the Phase-0 local seed; the live one now lives in banco-risa)

**Interfaces:**
- Consumes: the live Pages `banco.json`.
- Produces: the website reading real approved clips.

- [ ] **Step 1: Flip `BANCO_URL`**

In `~/Documents/flove/apps/liberada/risa/banco.js`, change:
```js
    BANCO_URL: 'banco.json',
```
to:
```js
    BANCO_URL: 'https://floveorg.github.io/banco-risa/banco.json',
```

- [ ] **Step 2: Remove the Phase-0 seed and confirm the page still degrades gracefully**

```bash
cd ~/Documents/flove && git rm -q apps/liberada/risa/banco.json
cd apps/liberada/risa && node --test test/banco.test.mjs   # still 6/6 (pure helpers unchanged)
```
Expected: tests still pass (the seed file is not referenced by tests). The page's empty/error states already handle an empty live banco.

- [ ] **Step 3: Commit (flove convention — scoped, trailer)**

```bash
cd ~/Documents/flove && git add apps/liberada/risa/banco.js apps/liberada/risa/banco.json
git commit -m "feat(risa): point Banco de la risa at the live banco-risa Pages feed

BANCO_URL -> https://floveorg.github.io/banco-risa/banco.json; remove the
Phase-0 local seed (real clips now come from the bot).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The cron workflow + end-to-end dry run

**Files:**
- Create: `~/banco-risa/.github/workflows/poll.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: poll
on:
  schedule:
    - cron: '*/10 * * * *'   # every ~10 min (best-effort on free tier)
  workflow_dispatch: {}
permissions:
  contents: write
concurrency:
  group: poll
  cancel-in-progress: false
jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Run the bot
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
        run: node bot/poll.mjs
      - name: Commit any changes
        run: |
          git config user.name 'banco-risa bot'
          git config user.email 'bot@users.noreply.github.com'
          if ! git diff --quiet; then
            git add banco.json state/ audio/
            git commit -m "banco: publish/moderate (automated)"
            git pull --rebase origin main
            git push origin HEAD:main
          else
            echo "no changes"
          fi
```

- [ ] **Step 2: Commit + push the workflow**

```bash
cd ~/banco-risa && mkdir -p .github/workflows
# (write the file above to .github/workflows/poll.yml)
git add .github/workflows/poll.yml
git commit -q -m "ci: cron poll workflow (every ~10 min + manual dispatch)" && git push -q origin HEAD
```

- [ ] **Step 3: End-to-end dry run (human-in-the-loop)**

1. Confirm the secret exists (Task 6 Step 1) and `config.json.modGroupId` is set.
2. Trigger the workflow manually: `https://github.com/floveorg/banco-risa/actions` → **poll** → **Run workflow**. It should succeed with "no changes" (empty queue).
3. From a normal Telegram account, **DM a voice note to @RisaLiberadaBot.** Run the workflow again → the clip should appear in **Risas Nuevas** with ✅/🗑, and the uploader gets the "¡Recibida!" reply.
4. In the group, tap **✅ Publicar.** Run the workflow again → the mp3 should be committed under `audio/`, prepended into `banco.json`, posted to **t.me/risaliberada**, and the mod message edited to "✅ Publicado".
5. Load the Risa Liberada page (Task 7 deployed) → the new clip appears in the **Banco de la risa** playlist and the **Últimas risas** feed.
6. Repeat with **🗑 Borrar** on another clip → confirm it is discarded and does not appear.

- [ ] **Step 4: Verify + note limits**

Confirm `https://floveorg.github.io/banco-risa/banco.json` shows the published clip. Note in the README that free-tier cron is best-effort (5–15 min latency; pauses after 60 days of no repo activity — any push resets it).

---

## Self-Review

**Spec coverage (Phase 1 parts of the spec):**
- §5.1 ingest (DM voice → queue + forward to mods + "recibida" reply) → Tasks 2, 5. ✓
- §5.2 moderate (✅ download+ffmpeg+prepend+channel+edit / 🗑 discard+edit) → Tasks 3, 5. ✓
- §5.3 listen (web reads banco.json; channel accumulates) → Tasks 7, 5. ✓
- §3 architecture (GitHub Actions cron, dedicated repo, Pages, offset state) → Tasks 1, 6, 8. ✓
- §4 data contract (name-based, absolute src, prepend newest-first) → Tasks 3, 5 + Global Constraints. ✓
- §6 license/consent (CC BY-SA 4.0 stated on ingest) → Task 5 "recibida" message. ✓
- §8 resilience (offset only advances on success¹; per-action try/catch; rebase before push) → Tasks 5, 8.
- §9 tests (pure logic unit-tested; dry-run) → Tasks 2, 3, 8. ✓

¹ **Known limitation to flag for the human/review:** this MVP advances the offset for the whole batch even if one action's I/O throws (the failed action is logged and left in the queue, but its update won't be re-fetched). That's acceptable for a low-volume laugh bot; a stricter "don't advance past the first failed action" retry is a possible later hardening — noted, not built.

**Placeholder scan:** none — every step has concrete code/commands.

**Deferred (NOT in this plan, per spec §1 non-objetivos):** OAuth web upload, thematic-playlist tagging, on-demand bot listen commands, VPS migration.

**Decisions I made (backend, per "no deep backend questions"):** zero-dependency Node calling the Bot API directly (no grammY); `copyMessage` to place the audio + buttons in the mod group; audio stored in the same repo (Git LFS not used — laugh clips are small; revisit if the repo grows); `answerCallbackQuery` + caption-edit as the moderator feedback.
