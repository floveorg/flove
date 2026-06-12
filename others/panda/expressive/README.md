# Pandas · emociones expresivas (gesto completo)

Versión **paralela** a `../standing/`. Misma base de pie (cuerpo + cabeza del
panda neutral), pero aquí **todo se adapta a la emoción**, no sólo la cara:

- **Ojos** — tamaño e inclinación por emoción (sorprendido grandes y redondos;
  enfadado rasgados; triste/preocupado caídos; feliz/celebrando en alza).
- **Fondo negro (parches)** — inclinación y tamaño por emoción (rotados sobre el
  centro del ojo: hacia arriba-fuera = alegre/enfadado; abajo-fuera = triste;
  grandes = sorprendido; asimétrico = pensativo).
- **Orejas** — tamaño y altura por emoción (sorprendido/celebrando grandes y
  alzadas; triste/dormido pequeñas y caídas; pensativo una más alta).
- **Gesto de brazos, pies y cabeza** específico de cada uno.

| emoción | gesto |
|---|---|
| enamorado | manitas a la cara (suspiro), cabeza ladeada, corazones |
| feliz | brazos arriba abiertos, de puntillas, ojos `^^`, destellos |
| celebrando | brazos en alto, salto, orejas grandes, ojos-estrella |
| guiño | un brazo saludando, cabeza ladeada, un ojo guiña |
| sorprendido | brazos arriba (susto), orejas alzadas, ojos enormes, boca-O, ❗ |
| pensativo | una manita al mentón, cabeza inclinada, una oreja alzada, una ceja arriba |
| preocupado | manitas arriba (retorciéndolas), orejas algo caídas, gota de sudor |
| triste | brazos caídos, cabeza gacha, orejas caídas, ojos tristes, lágrima |
| enfadado | brazos en jarra/fuera, cabeza baja, ojos rasgados, mejillas rojas, vena |
| dormido | brazos relajados, cabeza ladeada-gacha, orejas caídas, ojos cerrados, zZ |

Como los parches negros cubren el ojo, los ojos van en **blanco + pupila** para
verse (igual que en el neutral). Implementado con transforms sobre la base
(`rotate`/`scale` de los parches sobre el centro del ojo, rotación de brazos
sobre el hombro, etc.).

Ver: `index.html` o cada `panda-<emoción>.svg`.
