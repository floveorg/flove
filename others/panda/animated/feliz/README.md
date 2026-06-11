# Panda feliz · animación (celebración)

Acción: el panda **salta de alegría** dando dos botes seguidos, con los **dos
brazos levantados bombeando arriba** (cheer), la **cabeza meciéndose** a un lado
y a otro y la **sonrisota abriéndose y cerrándose** ("¡yay yay!").

Misma técnica que la animación del panda neutral (`../`), pero en su propia
carpeta y reutilizando el mismo `.venv`.

## Ficheros
- `gen_frames.py` — genera `frame-00.svg` … `frame-09.svg` (fuente de la animación).
- `frame-00..09.svg` — los 10 fotogramas, planos y autocontenidos (sin `<use>`).
- `build_gif.py` — rasteriza los SVG y monta `panda-feliz-celebra.gif`.
- `panda-feliz-celebra.gif` — el GIF final (240 px, en bucle).
- `preview.html` — ábrelo en el navegador: GIF + reproductor vectorial en vivo
  + la tira de fotogramas.

## Guion de los fotogramas
| # | qué hace |
|---|----------|
| 0–3 | primer salto: sube con los brazos al máximo y aterriza |
| 4–7 | segundo salto, meciendo la cabeza al otro lado |
| 8–9 | aterriza y da un rebote suave antes de repetir |

## Regenerar
```bash
python3 gen_frames.py            # reescribe los 10 SVG

# el GIF necesita un rasterizador SVG; aquí se reutiliza el venv del neutral:
../.venv/bin/python build_gif.py # reescribe panda-feliz-celebra.gif
```
Ajusta tamaño y tiempos en las constantes `SIZE` / `DURATIONS_MS` de `build_gif.py`,
y la coreografía (botes, grados de los brazos, mecer la cabeza) en `FRAMES` de
`gen_frames.py`.
