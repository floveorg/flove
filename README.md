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
├── blog/               # repo APARTE (marc/blog) anidado + gitignored — NO es de flove
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
# 1) blog (si cambió): repo aparte, publica directo a floveorg/blog
(cd blog && ./build-blog.sh publish)   # build + push → live en flove.org/blog
# 2) web + descarga (este repo)
./build-flove-zip.sh                   # sitio → flove.zip (sin blog/ephemerall/anim-form)
git add flove.zip && git commit        # commitea lo reconstruido
git push origin main                   # a Gitea
# …luego el reflejo a GitHub / flove.org  (skill update-web)
```

El blog se publica solo (a `floveorg/blog`); la web + descarga van por Gitea →
`update-web` → `floveorg/flove`.

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

## Blog (`flove.org/blog`)

El blog es un **repo aparte y privado — `marc/blog`** (Hugo, tema `flovelite`),
que vive **anidado en `flove/blog`** (gitignored, no forma parte de este repo).
Se sirve en `flove.org/blog/` desde **GitHub `floveorg/blog`**; el `publish`
construye y empuja el HTML allí directamente.

- Escribir/publicar posts, borradores privados → en `flove/blog` (ver su README).
- Los borradores (`draft:true`) viven solo en Gitea y **nunca** se sirven.
- El blog **no** va en `flove.zip` (la descarga es solo las apps, offline).

## Licencia

Todo el contenido de este repositorio (texto, código, diseños) está bajo
**[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**.
Ver [`LICENSE`](./LICENSE) para los términos completos.

Atribución sugerida: `flove · Marc (marcflove) · flove.org · CC BY-SA 4.0`.
