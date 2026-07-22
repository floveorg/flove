# Pendings

Punteros desde los docs: `↗ pendings:#N` (donde N es el ID).

---

## Docs (Questionnaire)

### Respondidas
1. ✅ ephemerall = standard de persistencia
3. ✅ Sí, todos responsive
4. ✅ AAA
7. ✅ Bilingüe en/es con icono en menú
8. ✅ Enlace floveslides26.2 + solo .ods
11. ✅ `Flove[Feature]26-6`, changelog button
12. ✅ Changelog en menú (excepto main/apps-intro/apps-graph/launchers)
15. ✅ Nada, privacidad
16. ✅ Linkchecker automático
17. ✅ Open Graph completo
18. ✅ Lighthouse 90+

### Pendientes
- **D02** Links cruzados entre docs pages
- **D05** Buscar en docs
- **D06** Theming/branding
- **D09** Ejemplos de código
- **D10** Navegación entre secciones
- **D13** Contribuir a docs
- **D14** Contacto/soporte
- **D19** Extensibilidad
- **D20** Mantenimiento futuro

---

## AAA Implementation

- **AAA01** Implementar WCAG AAA en `docs/index.html` — contraste 7:1, skip links, aria-describedby, expandir abreviaciones (3-4h)

---

## Build & Deploy

- **BD01** Rebuild `flove.zip` — paquete descargable actualizado
- **BD02** `update-web` — regenerar `sw.js` + `flove.zip` + push a GitHub Pages

---

## Banco Risa

- **BR01** Cablear `CLOUDINARY_URL` con la key que sube
- **BR02** Test end-to-end: audio → moderación → Cloudinary → banco.json
- **BR03** Verificar `/setprivacy` → Disable en BotFather
- **BR04** Design `risa-banco-telegram-moderation-design.md` — pendiente revisión Marc

---

## Git History

- **GH01** Force push a GitHub si es necesario (reescritura de historia)

---

## Coming Soon (deferred)

- **CS01** Save app button in menús → repo download link (no implementar)

---

## Nety

- **N01** Reconcile nety master — diverge de GitHub (26+5 commits)
- **N02** Choque rename flovenet→nety (1905 hits)
- **N03** Nety tagline en `flove-tiers-matrix.html`: "coming soon" → definir

---

## Validación & Pulido

- **V01** Fix `<a>`-en-`<ul>` de worthing.html
- **V02** Propagar validación a appy/diesafe/crumbly
- **V03** Workflow de mantenimiento por tiers

---

## Worldview

- **W01** Dump Whole → worldview §3

---

## Tiers & Builds

- **T01** Mini app build pending — tier/build rename + optimización
- **T02** Super tier placeholder in-development
- **T03** Mega tier reserved, not featured yet
- **T04** Nano/mega not yet authored
- **T05** Counters: mini/basic/advanced-placeholder/super-placeholder sin counters
- **T06** Sound-depth control pending a new design
- **T07** Narrativa/Films axis → standard del tier Super

---

## Backend & Export

- **BE01** backend.md draft v0.3 — documento incompleto
- **BE02** Publish.md: "more" publish mode placeholder para nety·0asis
- **BE03** Coordinates.md: flove-quality measure, Tiers >5, Gitea↔docs sibling rule

---

## Designs Pendientes

- **DS01** `flove-pwa-installable-design.md` — pendiente plan de implementación
- **DS02** `flove-private-addon-login-encryption-design.md` — pendiente plan de implementación
- **DS03** `appy-advanced-athenea-desk.md` — Tasks 6 (wizy.html), 7 (sety.html), 8 (making-of.html)
- **DS04** `appy-intros-rainbow-roadmap-design.md` — features-intro stubbed, nav location TBD

---

## Android / APK

- **APK01** Android SDK no instalado — necesario para `bubblewrap build`

---

## Otros

- **O01** Actualizar MEMORY.md con cambios recientes
