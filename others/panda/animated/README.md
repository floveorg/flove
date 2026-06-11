# Panda neutral · animación

Acción: el panda **te habla de frente** y luego **mueve el brazo y la cabeza
para mostrarte algo arriba a la derecha** (de la imagen), terminando en pose de
presentación mientras lo comenta.

## Ficheros
- `gen_frames.py` — genera `frame-00.svg` … `frame-09.svg` (fuente de la animación).
- `frame-00..09.svg` — los 10 fotogramas, planos y autocontenidos (sin `<use>`,
  para que cualquier rasterizador los convierta).
- `build_gif.py` — rasteriza los SVG y monta `panda-neutral-talk.gif`.
- `panda-neutral-talk.gif` — el GIF final (240 px, en bucle).
- `preview.html` — ábrelo en el navegador: muestra el GIF, un reproductor
  vectorial en vivo y la tira de fotogramas.

## Guion de los fotogramas
| # | qué hace |
|---|----------|
| 0–3 | habla de frente (la boca abre/cierra, parpadeo de mirada) |
| 4–7 | gira la cabeza y **levanta el brazo derecho** apuntando arriba-derecha |
| 8–9 | sostiene el gesto y comenta lo que muestra |

## Regenerar
```bash
python3 gen_frames.py            # reescribe los 10 SVG

# el GIF necesita un rasterizador SVG; aquí se usa cairosvg en un venv local:
python3 -m venv .venv
.venv/bin/pip install cairosvg pillow
.venv/bin/python build_gif.py    # reescribe panda-neutral-talk.gif
```
Ajusta tamaño y tiempos en las constantes `SIZE` / `DURATIONS_MS` de `build_gif.py`.
