# Banco de la risa · subida + moderación por Telegram — diseño

**Fecha:** 2026-07-19
**App:** Risa Liberada (`flove/apps/liberada/risa/index.html`)
**Estado:** diseño aprobado (pendiente revisión final de Marc)

---

## 1. Qué construimos

Un circuito para que **la gente aporte su risa** y **un grupo de moderadores la publique o la descarte**, sin servidor propio que mantener:

- **Alguien sube** un audio de su risa **por Telegram** (nota de voz / audio al bot).
- **Un grupo de moderadores** recibe cada clip en un chat privado de Telegram y decide con dos botones: **✅ Publicar / 🗑 Borrar**.
- Si se **publica**, el clip entra en la **playlist reproducible «Banco de la risa»** de la página web *y* se publica en un **canal público de Telegram** para escucharlo también ahí.
- Si se **borra**, se descarta.

Telegram es la herramienta de **tres caras**: subir · moderar · escuchar. La página web es el **escaparate público** donde el mundo escucha el banco.

### Objetivos
- Circuito completo subir → aprobar → publicar, funcionando de punta a punta.
- **Cero servidor que vigilar**: todo vive en GitHub (repo + secret + un workflow).
- **Mobile-first**: grabar una nota de voz es el gesto nativo del móvil.
- Todo **FOSS** y con **licencia libre** en cada clip.

### No-objetivos (v1)
- Puerta de subida web con login Google/social (OAuth) → **aplazada a fase posterior**.
- Clasificar el clip en las 5 playlists temáticas al aprobar (Q3-C) → aplazado.
- Bot conversacional en tiempo real (comandos tipo `/escuchar` bajo demanda) → resuelto vía canal (§4), no vía bot on-demand.

---

## 2. Roles y superficies

| Rol | Cómo entra | Identidad | Qué puede hacer |
|-----|-----------|-----------|-----------------|
| **Persona que aporta** | DM al bot en Telegram | Su cuenta de Telegram (user id + nombre) | Enviar nota de voz/audio + nombre y etiquetas opcionales |
| **Moderador/a** | Miembro del **grupo privado de moderadores** | Estar en ese grupo *es* la credencial («telegram code preferido»; email y demás quedan como respaldo futuro) | Ver la cola, tocar ✅ Publicar / 🗑 Borrar |
| **Público** | Página web · canal público de Telegram | — | Escuchar el banco |

La subida es **abierta pero identificada**: cualquiera puede aportar, pero Telegram nos da una identidad verificada (nada de subida anónima cruda), lo que frena el spam y da a los moderadores un contacto.

---

## 3. Arquitectura (todo dentro de GitHub)

```
  Persona ──nota de voz──▶ 🤖 bot Risa Liberada  (DM)
                                  │
        GitHub Actions (cron ~5–10 min): Telegram getUpdates
                                  │
              clip nuevo ─────▶ 🔒 grupo de moderadores
                                    con  ✅ Publicar / 🗑 Borrar
                                  │
              moderador/a toca un botón (lo recoge el siguiente cron)
                                  │
                 ┌────────────────┴────────────────┐
            ✅ Publicar                         🗑 Borrar → descartar
                 │
   Action: ffmpeg→mp3 · añade a banco.json · commit · push
                 │
        ┌────────┴────────┐
   GitHub Pages        📢 publica el clip en el
   → playlist web          canal público «Banco de la risa»
      «Banco de la risa»   (= escuchar en Telegram)
```

### El único punto delicado — y cómo se resuelve «escuchar en Telegram»
Un bot por cron solo está «despierto» cada pocos minutos, así que **no puede** responder en tiempo real a quien escribe «ponme el banco». Por eso, **escuchar en Telegram = un canal público «Banco de la risa»**: cada clip aprobado se publica ahí como mensaje de audio reproducible. Cualquiera abre el canal, hace scroll y toca play, cuando quiera, sin esperar al bot. Subir y los toques ✅/🗑 sí pueden ser asíncronos — unos minutos de retardo en una risa no importan.

### Por qué GitHub Actions (cron) y no VPS
- **A favor:** todo en GitHub (comfort zone frontend de Marc), mismo espíritu serverless que LowAI «Supports», sin proceso que vigilar, `ffmpeg` ya viene en el runner.
- **Compromisos aceptados:**
  - *Latencia:* un clip aparece/se publica dentro de un ciclo de cron (~5–15 min). Aceptable para risas.
  - *Fiabilidad:* los cron gratuitos son *best-effort* (pueden retrasarse; los workflows programados se pausan tras 60 días sin actividad — cualquier push lo reactiva).
  - *Estado:* guardamos el `update_id` de Telegram en el repo para no reprocesar ni perder mensajes.
- **VPS Webdock queda como respaldo** si algún día se quiere publicación instantánea o mucho volumen. El diseño deja ese cambio como *drop-in*, no reescritura (§8).

### Topología de repos (decisión de diseño)
Repo dedicado **`floveorg/banco-risa`** (GitHub), separado del repo fuente de flove (Gitea) y del sitio publicado (`floveorg/floveorg.github.io`). Contiene: el workflow del bot, el estado, `banco.json` y los mp3 aprobados; se sirve por su **propio GitHub Pages**.

- La página de risa hace `fetch` de `banco.json` y reproduce los mp3 desde ese origen de Pages. GitHub Pages envía CORS permisivo (`Access-Control-Allow-Origin: *`) para `banco.json`; la reproducción de `<audio>` cross-origin no necesita CORS.
- **Por qué separado:** aísla el crecimiento de binarios del repo principal de flove; concentra el secret del bot en un solo sitio; **no toca** el pipeline `update-web` existente (Gitea → floveorg.github.io).
- **Excepción declarada a la doctrina «apps sin llamadas externas»:** el banco es, por naturaleza, contenido **vivo/comunitario**; la página lo pide solo a un origen **controlado por flove**. Excepción deliberada y acotada, no un patrón general.
- *Alternativa considerada:* meter `banco/` dentro de `floveorg.github.io` y enseñar a `update-web` a preservar esa carpeta (mismo origen, sin excepción de doctrina, a cambio de un retoque del pipeline). Se elige el repo dedicado por aislamiento; se revisará en el plan si Marc prefiere la alternativa.

---

## 4. Modelo de datos

Todo son ficheros en `floveorg/banco-risa`:

- **`state/offset.txt`** — último `update_id` de Telegram procesado.
- **`state/queue.json`** — clips pendientes de moderar:
  ```json
  [{ "id": "q_ab12", "file_id": "<telegram file_id>", "from_user": 12345,
     "name": "Marta", "tags": "contagiosa, de grupo",
     "mod_chat_id": -100..., "mod_msg_id": 678, "submitted_at": "2026-07-19T10:00:00Z" }]
  ```
- **`banco.json`** — clips publicados (lo que lee la web):
  ```json
  [{ "id": "b_9f3", "t": "Risa de Marta", "src": "audio/b_9f3.mp3",
     "by": "Marta · CC BY-SA 4.0", "tags": "contagiosa, de grupo",
     "when": "2026-07-19", "channel_msg": 42 }]
  ```
- **`audio/b_*.mp3`** — audio publicado (convertido con ffmpeg; normalizado en volumen; recortado a un máximo de duración, ver §6).

`banco.json` reutiliza las claves del array `playlists` que ya usa la página (`t`, `src`, `by`, `tags`), así que la playlist «Banco de la risa» se construye con el mismo renderizador que las otras cinco.

---

## 5. Los tres flujos

### 5.1 Subir (persona → bot)
1. La persona abre `t.me/RisaLiberadaBot` (deep link desde el botón «💬 Comparte tu risa» de la web) y envía una **nota de voz o audio**.
2. En la **primera interacción**, el bot muestra el **aviso de licencia**: «Al enviar tu risa la publicas en libre, bajo CC BY-SA 4.0, atribuida al nombre que elijas.» Enviar = consentir.
3. Opcionalmente el bot pregunta **nombre a mostrar** y **etiquetas** (o los infiere de nombre de Telegram / vacío).
4. El bot responde: «¡Recibida! 💛 En revisión, pronto en el banco.»
5. El siguiente cron recoge el mensaje, lo mete en `queue.json` (guarda `file_id`, aún sin descargar el binario) y lo reenvía al grupo de moderadores.

### 5.2 Moderar (bot → grupo privado)
1. El clip llega al grupo con: audio reproducible, nombre, etiquetas, y botones inline **✅ Publicar / 🗑 Borrar** (el `callback_data` lleva el `id` de la cola).
2. Un moderador toca un botón. El siguiente cron recoge el `callback_query`.
   - **✅ Publicar:** descarga el `file_id`, `ffmpeg` → mp3 normalizado, añade entrada a `banco.json`, guarda `audio/b_*.mp3`, publica el mensaje de audio en el **canal público**, edita el mensaje del grupo a «✅ Publicado por @moderador».
   - **🗑 Borrar:** quita de `queue.json`, edita el mensaje a «🗑 Borrado por @moderador».
3. Commit + push de los ficheros cambiados; se actualiza `offset.txt`.

### 5.3 Escuchar (público)
- **Web:** la página hace `fetch` de `banco.json` y monta la **6ª playlist «Banco de la risa»** (reproducible como las otras). La sección «lo último que ha entrado al banco» pasa a mostrar los últimos N clips **reales** de `banco.json`.
- **Telegram:** el **canal público** acumula cada clip aprobado como audio reproducible; se escucha haciendo scroll.

---

## 6. Anti-abuso, privacidad, licencia

- **Anti-abuso:** solo se aceptan mensajes de **voz/audio**; duración máx. (p. ej. 30 s) y tamaño máx.; límite de frecuencia por `from_user`. Los moderadores son la puerta final. Identidad de Telegram siempre presente (ni un clip anónimo crudo).
- **Privacidad:** se guarda lo mínimo — `from_user` (id numérico de Telegram) y el **nombre a mostrar** elegido. Nada de email en v1. El id de Telegram no se expone en `banco.json` (solo el nombre a mostrar).
- **Licencia:** cada clip se publica bajo **CC BY-SA 4.0** (coincide con el resto de pistas de la página; conmutar a CC0 es trivial si se decide). El bot lo declara antes de aceptar; `banco.json` lo refleja en el campo `by`.

---

## 7. Cambios en la página web (`risa/index.html`)

1. **Feed falso → real:** hoy el feed son nombres+etiquetas en `localStorage` con datos semilla; pasa a leer los últimos N de `banco.json`.
2. **6ª playlist «Banco de la risa»:** nueva tarjeta que carga `banco.json` async y construye pistas con el renderizador existente. Estados **vacío** («aún no hay risas, sé la primera 💛») y **error de red** contemplados.
3. **Botón «💬 Comparte tu risa» → deep link** `t.me/RisaLiberadaBot` (sin backend en el lado web).
4. El formulario de subida `localStorage` actual **se retira** (su función la cubre Telegram). El modal puede reconvertirse en un «cómo aportar por Telegram» con el deep link + código QR.
5. Se mantiene **mobile-first** y accesible como el resto de la página.

---

## 8. Manejo de errores y resiliencia

- **Offset:** si un cron falla a mitad, no se avanza `offset.txt` hasta commitear con éxito → como mucho se reprocesa (idempotente por `id`), nunca se pierde.
- **Descarga/ffmpeg falla:** el clip se queda en cola; el mensaje del grupo se marca «⚠️ reintentar»; no rompe el resto del lote.
- **Push falla (carrera):** `git pull --rebase` antes de push; reintento.
- **Workflow pausado (60 días):** un cron muy espaciado adicional o cualquier push lo reactiva; se documenta.
- **Cambio a VPS (futuro, drop-in):** la lógica de proceso (parsear updates → acciones, añadir a `banco.json`, gestionar offset) se escribe como **funciones puras** independientes del disparador; migrar a un proceso always-on con webhook reusa esas funciones sin reescribir.

---

## 9. Pruebas (TDD)

- **Funciones puras del bot** (lo importante): parseo de `getUpdates` → lista de acciones; añadir a `banco.json`; gestión de `offset`; idempotencia por `id`. Tests unitarios con fixtures de payloads de Telegram.
- **Modo dry-run** del workflow: procesa fixtures sin llamar a Telegram ni commitear.
- **Web:** render de la playlist «Banco de la risa» a partir de un `banco.json` de fixture; estados vacío/error.

---

## 10. Fases (de abajo arriba — «ke fluya»)

- **Fase 0 — Web (primero, terreno de Marc):** la página lee `banco.json` (con un fixture semilla), monta la playlist «Banco de la risa» real, feed real, botón → deep link de Telegram. Visible y disfrutable sin bot todavía.
- **Fase 1 — El bot (Actions cron):** ingesta → grupo de moderadores → ✅/🗑 → commit + post al canal. Cierra el circuito.
- **Fase 2 — Aplazado:** puerta de subida web OAuth (Google/social + email); etiquetado en playlists temáticas (Q3-C); comandos on-demand del bot.

---

## 11. Preguntas abiertas (para el plan)
- Nombre/handle definitivos del bot y del canal público.
- Confirmar repo dedicado `floveorg/banco-risa` vs. carpeta preservada dentro del sitio.
- Lenguaje del bot: Python (`python-telegram-bot`) vs. Node (`grammY`) — ambos FOSS; se decide en el plan.
- Duración/tamaño máx. exactos y política de límite de frecuencia.
