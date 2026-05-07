# ✺ flove

Sitio del proyecto **flove** — _slow it · flow it · love it._

## Estructura del repo

```
.
├── apps/              # Sitio raíz: launcher lite + 13 demos HTML
│   ├── index.html     # = home (antes launcher_lite.html)
│   ├── launcher.html  # launcher completo
│   ├── explorer.html  # explorador de archivos (antes index.html)
│   ├── flove.css
│   └── *.html         # las 13 demos
├── blog/              # Hugo (tema Ananke como submódulo)
│   ├── hugo.toml
│   ├── content/posts/
│   └── themes/ananke/ # submódulo
├── docs/              # ⚠ ignorada por git (4 GB) — taxonomía FloveAll
├── context/           # ⚠ ignorada por git (291 MB) — theory pack
├── .gitlab-ci.yml     # build + deploy a GitLab Pages
└── .gitignore
```

## Cómo se publica

GitLab Pages compila en cada push a `main`:

1. Copia `apps/*` → `public/`
2. Compila Hugo `blog/` → `public/blog/`
3. Sirve `public/` en el dominio (https://flove.org/).

URLs resultantes:

| URL                 | Origen                           |
|---------------------|----------------------------------|
| `flove.org/`        | `apps/index.html` (lite home)    |
| `flove.org/launcher.html` | `apps/launcher.html`        |
| `flove.org/whole.html`    | `apps/whole.html`           |
| `flove.org/blog/`   | Hugo build                       |

## Previsualización local

**Sitio estático (apps/):**

```bash
cd apps && python3 -m http.server 8000
# → http://localhost:8000/
```

**Blog Hugo:**

```bash
# instala hugo extended si no lo tienes:
#   sudo snap install hugo --channel=extended
# o:  https://gohugo.io/installation/
cd blog && hugo server -D
# → http://localhost:1313/blog/
```

**Build de prueba (mismo que CI):**

```bash
mkdir -p public && cp -r apps/. public/
hugo --source blog --destination ../public/blog --minify
# luego: cd public && python3 -m http.server 8000
```

## Cómo añadir un post

```bash
cd blog
hugo new posts/mi-post.md
# edita content/posts/mi-post.md, pon `draft: false`, commit & push.
```

## Configurar GitLab + dominio

1. Crear repo vacío en GitLab y `git remote add origin <url>` + `git push -u origin main`.
2. GitLab → **Deploy → Pages → New Domain** → `flove.org`.
3. En el DNS de tu registrador:
   - `A` raíz → IP que indique GitLab
   - `CNAME www` → `<usuario>.gitlab.io`
   - `TXT _gitlab-pages-verification-code` → token que da GitLab
4. Marcar "Force HTTPS" y esperar a Let's Encrypt.

## Notas

- `docs/` y `context/` están en `.gitignore` por tamaño. Si necesitas
  publicar parte de `docs/`, mueve esa subcarpeta a `apps/docs/` o
  ajusta `.gitignore` y `.gitlab-ci.yml`.
- El tema Ananke se actualiza con:
  `git submodule update --remote blog/themes/ananke`.
