# ✺ flove · oasis

The reference map of **Oasis** (the 0asis backend) and how **flove adapts onto
it**. Read this before touching anything that publishes flove content to the
network. It feeds directly into the backend roadmap: this is the deep reference
behind **F1 `routing.json`** and **F2 `OasisPublisher`** (→ `backend.md` §2,
§6, §7; `overview.md` §4–§5).

---

## 0 · What Oasis is (and which Oasis)

**Oasis = a libre, P2P, encrypted, federated social ecosystem built on Secure
Scuttlebutt (SSB).** You are the centre of your own append-only feed; "pubs"
are always-on relay nodes that gossip content across the mesh. No accounts, no
passwords — identities are randomly-generated keypairs.

There are **two** Oasis codebases — don't confuse them:

| | Origin | What it is |
|---|--------|-----------|
| `fraction/oasis` | Christian Bundy | the **original**, minimal SSB web client |
| **`epsylon/oasis`** | psy / **KrakenLabs · SolarNET.HuB** | the **fork we run** — hugely expanded (45+ modules, ECOin economy, AI "42", Parliament, Courts, LARP) |

**Ours is `epsylon/oasis`.** Canonical homes:
- Code: `github.com/epsylon/oasis` (also `code.03c8.net/epsylon/oasis`)
- Project site: **`0asis.net`** · pub directory: **`oasis-project.pub`**
- Wiki: `wiki.solarnethub.com` · org: `solarnethub.com` / `krakenslab.com`
- License: **AGPL-3.0** · author: psy `<epsylon@riseup.net>`

This is the "API de 0asis disponible" referenced in the flove backend plan.

---

## 1 · Local deployment reality

Lives at **`/home/kdeneon/oasis`** (cloned + extracted; git remote = `epsylon/oasis`,
currently **v0.8.1**).

- **Start:** `cd /home/kdeneon/oasis && sh oasis.sh --port=3001 --no-open`
  - **Port 3000 (the default) is taken by docker-proxy** → always pass `--port=3001`.
  - GUI then on `http://localhost:3001`; SSB protocol on `:8008`.
- **Modes:** `sh oasis.sh` (GUI, default) · `sh oasis.sh server` (headless pub) ·
  `sh oasis.sh help`. PUB admin: `whoami`, `invite [N]`, `name`, `announce`,
  `follow`, `status`, `gossip`.
- **Deps live in `src/server/node_modules`** (≈1130 pkgs). `backend.js` requires
  them via relative paths like `../server/node_modules/<pkg>`. If a module dir
  exists but is **empty** → the install was interrupted; fix with
  `cd src/server && npm install`. (`postinstall` patches `ssb-ref` + `ssb-blobs`.)
- **AI is off** (no `src/AI/*.gguf` model downloaded). `oasis.sh` auto-flips
  `aiMod` on/off in the config depending on whether the model file exists, so
  leaving it absent keeps the AI tabs hidden. Enabling full AI = ~3.9 GB download.
- Node v24 works (installer asks for 22; fine).

---

## 2 · Architecture (the parts that matter for flove)

```
browser (pure HTML+CSS, NO client JS)
   │  GET/POST form submits
   ▼
Koa + @koa/router  ──►  src/backend/backend.js   (the one ~400KB router file)
   │                         │ calls
   │                         ▼
   │                    src/models/<x>_model.js   (read/write SSB messages)
   │                         │ via "cooler"
   ▼                         ▼
src/views/<x>_view.js     src/server/SSB_server.js  (the sbot: SecretStack + ssb-db2 + plugins)
   (hyperaxe → HTML)
```

- **No browser JavaScript.** The whole UI is server-rendered HTML+CSS; every
  interaction is a plain `<form method=GET/POST>`. This is a hard project rule
  ("A really secure frontend"). **→ this is the single most important fact for
  flove adaptation (§4).**
- **Views** are built with **hyperaxe** (JS functions `div()`, `form()`,
  `button()`… that emit HTML strings), wrapped in `template(title, …)` from
  `main_views.js`. No template files.
- **The sbot** (`SSB_server.js`) is a `SecretStack` with ssb-db2 + the classic
  plugin set: `ssb-gossip`, `ssb-ebt`, `ssb-friends`, `ssb-blobs`, `ssb-conn`,
  `ssb-invite`, `ssb-about`, `ssb-backlinks`, `ssb-private`, `ssb-onion` (Tor)…
- **`cooler`** (`src/client/gui.js`) is the lazy connection handle every model
  receives: `const ssb = await cooler.open()` → then `ssb.publish`, `ssb.get`,
  `ssb.createLogStream`.

---

## 3 · The SSB data model + module anatomy

### Data model (append-only, no edits/deletes)
Every record is an **SSB message** identified by a `content.type` string. SSB is
append-only, so "edit" and "delete" are emulated:
- **Edit** → publish a new message with `replaces: <oldKey>`; the model's index
  ignores superseded messages.
- **Delete** → publish a `{ type: "tombstone", target: <oldKey> }` message.

Example published content (the `bookmark` module):
```js
{ type: "bookmark", author: ssb.id, url, tags, description, category,
  createdAt, updatedAt, opinions: {}, opinions_inhabitants: [] }
```

### Module anatomy — the 8 touch-points to add a feature
Reference module to copy: **`bookmark`** (`bookmarking_model.js` + `bookmark_view.js`).

1. **Model** — `src/models/<name>_model.js`: `module.exports = ({ cooler }) => {…}`,
   define `type:"<name>"`, expose `listAll / getById / create / update / delete /
   createOpinion`. Read via `ssb.createLogStream`, write via `ssb.publish`.
2. **Register model** — in `backend.js` (~line 554):
   `const xModel = require("../models/<name>_model")({ cooler, isPublic: config.public })`.
3. **View** — `src/views/<name>_view.js`: hyperaxe functions returning HTML;
   forms POST to the routes; texts via `i18n`.
4. **Routes** — in `backend.js`, guarded by `checkMod(ctx,'<name>Mod')`:
   `GET /<name>` (list), `GET /<name>/:id`, `GET /<name>/edit/:id`,
   `POST /<name>/create`, `POST /<name>/update/:id`, `POST /<name>/delete/:id`,
   `POST /<name>/opinions/:id/:cat`.
5. **Menu link** — `src/views/main_views.js`: `renderXLink()` gated on
   `getConfig().modules.<name>Mod === "on"`.
6. **Modules admin** — add to the `modules` array in `src/views/modules_view.js`.
7. **Config flag** — `src/configs/oasis-config.json` → `"modules": { "<name>Mod": "on" }`.
   Saved/toggled via `POST /save-modules`.
8. **i18n** — add keys to `src/client/assets/translations/oasis_<lang>.js`
   (langs: en es fr eu de it pt zh ar hi ru; loaded by `i18n.js`).

### Key files
| Purpose | Path |
|---|---|
| Router (all routes) | `src/backend/backend.js` |
| Module flags | `src/configs/oasis-config.json` |
| Model template | `src/models/bookmarking_model.js` |
| View template | `src/views/bookmark_view.js` |
| Menu / `template()` / `i18n` | `src/views/main_views.js` |
| Modules admin UI | `src/views/modules_view.js` |
| SSB connection handle | `src/client/gui.js` (`cooler`) |
| sbot bootstrap | `src/server/SSB_server.js` |
| Translations | `src/client/assets/translations/` |

---

## 4 · Mapping flove → Oasis

The thesis: **a flove app becomes an Oasis module; a flove element becomes an SSB
message type.** The pieces already named in the flove backend plan line up:

| flove concept | Oasis equivalent | Notes |
|---|---|---|
| **CSS-pure distro** (tiers `mini`/`basic`, 0 JS) | Oasis frontend (HTML+CSS, no client JS) | **Strongest alignment.** Oasis *forbids* browser JS; flove's CSS-first stance is native here. The JS distro (`flove.js`) does **not** port — only the CSS-pure surface does. |
| **`FloveElement`** + `asterism_path` | one SSB `content.type` (e.g. `type:"flove.<class>"`) | the 9 universal classes (Act·Wish·Bond·Place·Person·Time·Object·Freedom·Rating) → typed messages |
| **`OasisPublisher`** adapter (F2) | `ssb.publish(content)` via a model's `create()` | the Publisher adapter wraps exactly the §3 model write path |
| **`routing.json`** (F1) | app → module + field → message-type map | declarative map from each flove app field to an Oasis module/route |
| **common traceable area** (F4) | SSB feed + `ssb-backlinks` / `ssb-tangle` / search | cross-app querying rides on SSB links + backlinks |
| **identity + Publish button** (F3) | SSB keypair (`@…​.ed25519`); no login | identity is the feed id; "masks" = managing which feed |
| **puzzy engine** (F6) | could live as `opinions`/ratings on messages | Oasis already has an opinions/voting primitive per message |
| **module 42 (fine-tuned AI)** (F5) | Oasis AI "42" (`aiMod`, gguf model) | only if a model is downloaded; off by default |

**Practical consequence:** to adapt a flove app, build it as an Oasis module
(the §3 8-step recipe) whose `view.js` renders the app's **CSS-pure** markup and
whose `model.js` publishes the app's fields as a typed SSB message. The CSS-pure
flove apps are the portable ones; anything depending on `flove.js` (drag&drop,
dynamic lists, SVG editing, live selection) has no home in the no-JS frontend and
must be redesigned as form round-trips or dropped for the Oasis surface.

→ This is the "distro CSS-pura (spec portable a otras plataformas)" of the two
flove distros, with Oasis as its first real target platform.

---

## 5 · Open questions / next steps

- **Module-per-app vs one flove module?** Either 1 Oasis module per flove app, or
  a single `flove` module routing internally by `asterism_path`. (Mirrors the
  routing-authoring open question in `backend.md` §9/§12.)
- **Message-type namespacing:** `type:"flove.act"` vs reusing Oasis native types
  (e.g. flove "bonds" → Oasis `bookmark`/`opinions`)? Reuse buys interop with
  existing Oasis modules; custom types keep the flove ontology clean.
- **Upstream vs fork:** contribute flove modules to `epsylon/oasis`, or maintain a
  flove overlay? AGPL-3.0 either way.
- **No-JS redesign:** audit which flove apps survive the pure-HTML+CSS constraint
  (CSS-pure tiers pass; advanced JS apps need rework). Tie to the tier model.
- **Pub hosting:** if flove wants its own always-on relay, run `sh oasis.sh server`
  + `announce` and list on `oasis-project.pub`.

---

## Links

- Code: `github.com/epsylon/oasis` · `code.03c8.net/epsylon/oasis`
- Site: `0asis.net` · Pub directory: `oasis-project.pub`
- Wiki: `wiki.solarnethub.com` (modules, roadmap, LARP houses, ECOin)
- SSB protocol guide: `ssbc.github.io/scuttlebutt-protocol-guide`

*Deep reference for the flove→0asis adaptation. The roadmap that consumes it is
`backend.md` §2/§6/§7 + `overview.md` §5 (phases F1–F6).*
