# ✺ flove

Sitio del proyecto **flove** — _slow it · flow it · love it._

Página única por app, HTML/CSS/JS sin frameworks. `index.html` en la raíz es el
home de **https://flove.org**.

## Estructura del repo

```
.
├── index.html          # home de flove.org (Docs · Apps · Download)
├── launch.html         # selector de idioma EN/ES — página por defecto en local
├── flove-icon.svg      # icono clásico de flove
├── flove.zip           # paquete local que reparte el botón "Download / Go local"
├── build-flove-zip.sh  # construye flove.zip desde `git archive HEAD`
├── build-blog.sh       # construye el blog Hugo (blog/_src/) → /blog
├── blog/               # blog: salida estática servida (flove.org/blog/) …
│   └── _src/           # …y su fuente Hugo (hugo.toml · content/posts/ · tema flovelite)
├── apps/               # índice de demos + las apps (puzzy, appy, blogy, metas, …)
│   ├── index.html      # índice de demos
│   ├── flove.css · flove.js
│   └── */ · *.html     # las apps
├── docs/               # teoría / "Whole" paso a paso (docs/index.html sí se sirve)
├── images/             # logos, pandas y demás assets
├── others/             # tarjetas, experimentos sueltos
├── CNAME · .nojekyll   # config de GitHub Pages (dominio + sin Jekyll)
├── LICENSE             # CC BY-SA 4.0
└── .gitignore · .htmlvalidate.json
```

## Cómo se publica

**Gitea es la fuente de verdad; GitHub Pages sirve el sitio.**

1. Trabajas y commiteas contra Gitea: `localhost:3000/marc/flove` (rama `main`).
2. Para publicar, reflejas `main` a GitHub `floveorg/flove` (skill `update-web`).
3. GitHub Pages sirve esa rama tal cual (estático, `.nojekyll` desactiva Jekyll)
   en **https://flove.org** (dominio vía `CNAME`).

No hay build en CI: lo que está commiteado _es_ lo que se sirve.

### Publicar (web + descarga + blog)

Trabajas en local contra Gitea. Cuando toca sacar todo a producción, el pase de
publicación reconstruye lo derivado y luego refleja a GitHub:

```bash
./build-blog.sh                       # blog-src/ → /blog (si cambió el blog)
./build-flove-zip.sh                  # sitio → flove.zip (la descarga)
git add blog flove.zip && git commit  # commitea lo reconstruido
git push origin main                  # a Gitea
# …luego el reflejo a GitHub / flove.org  (skill update-web)
```

Así la web, la **descarga** (flove.zip) y el **blog** salen a la vez y coherentes.

## Descarga / uso local ("Go local")

El botón **Download / Go local** del home reparte `flove.zip` — todo flove,
para usarlo sin conexión:

1. Descomprímelo.
2. Doble clic en el lanzador **flove-localhost.desktop**.
3. `start-flove.sh` sirve la carpeta en `localhost:8642` y abre `launch.html`
   (selector de idioma). Elige idioma y listo.

El lanzador (`start-flove.sh` + `flove-localhost.desktop`) **se genera al
construir el zip** — no se versiona, para mantener limpia la raíz servida y que
ninguna ruta de máquina acabe en git.

## Trabajo local (dev)

Previsualizar el sitio:

```bash
cd flove && python3 -m http.server 8000
# → http://localhost:8000/
```

Reconstruir el paquete de descarga (tras commitear tus cambios):

```bash
./build-flove-zip.sh          # → flove.zip
git add flove.zip && git commit
```

## Blog (`/blog`)

Blog Hugo, tema propio **`flovelite`** (una hoja de estilo, sin JS, claro/oscuro).
Requiere [Hugo extended](https://gohugo.io/installation/)
(`snap install hugo --channel=extended`).

```bash
./build-blog.sh serve     # previsualiza en http://localhost:1313/ (con borradores)
./build-blog.sh           # construye blog-src/ → /blog (minificado)
```

Todo el blog vive bajo una sola carpeta `blog/`:

- **`blog/_src/`** = fuente Hugo (config, posts en `content/posts/`, tema). Se versiona.
- **`blog/`** (raíz) = salida estática ya construida; es lo que sirve
  `flove.org/blog/`. Commitea `/blog` tras reconstruir; `build-blog.sh` regenera
  los HTML sin tocar `_src/`.
- El blog **no** va en `flove.zip` (la descarga es solo las apps, offline).

Nuevo post: crea `blog/_src/content/posts/mi-post.md` con front-matter
(`title`, `date`, `tags`), escribe, `./build-blog.sh`, commit.

## Licencia

Todo el contenido de este repositorio (texto, código, diseños) está bajo
**[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**.
Ver [`LICENSE`](./LICENSE) para los términos completos.

Atribución sugerida: `flove · Marc (marcflove) · flove.org · CC BY-SA 4.0`.
