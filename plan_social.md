# Plan Social — flove network

## Visión

Cada usuario tiene un handle `@usuario` único. Puede publicar los resultados de cualquier app completada en su **feed personal**. Otros usuarios pueden ver su feed, seguirlo, y mencionarlo con `@usuario`. Las publicaciones muestran qué app se usó, los puntos obtenidos, y un resumen del contenido.

El sistema social se integra **sin romper el diseño actual** — respeta `flove.css`, los estilos oscuros, y la filosofía de "internet lento".

---

## 1. Base de datos

### Tablas nuevas (en schema.sql)

```sql
-- 1.1 Posts — publicaciones de resultados de apps
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  form_type TEXT,
  content TEXT NOT NULL DEFAULT '',
  data_snapshot JSONB,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_app_name ON posts(app_name);

-- 1.2 Post Likes
CREATE TABLE post_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 1.3 Mentions (@usuario dentro del content de un post)
CREATE TABLE mentions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, mentioned_user_id)
);

CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);

-- 1.4 Follows
CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE INDEX idx_follows_followee ON follows(followee_id);

-- 1.5 Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention','follow','like')),
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- 1.6 Extensión de users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';
```

### Seed de badges sociales (opcional)
- `social_first_post` — 1 post publicado
- `social_ten_posts` — 10 posts
- `social_followed_5` — 5 seguidores
- `social_mentioned` — primera mención recibida

---

## 2. API — Rutas nuevas

Todas bajo `/api/` con prefijos:

### 2.1 `/api/users/` — Perfil público y búsqueda

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/users/@:username` | No | Perfil público de un usuario + últimos posts |
| GET | `/api/users/search?q=` | No | Buscar usuarios por @username o display_name |
| GET | `/api/users/me` | Sí | Perfil propio (editable) |
| PUT | `/api/users/me` | Sí | Editar bio, website_url |

### 2.2 `/api/feed/` — Posts y timeline

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/feed/publish` | Sí | Publicar resultado de app en feed |
| GET | `/api/feed/@:username` | No | Obtener posts de un usuario (paginado) |
| GET | `/api/feed/timeline` | Sí | Timeline de usuarios que sigo |
| POST | `/api/feed/like/:postId` | Sí | Dar like |
| DELETE | `/api/feed/like/:postId` | Sí | Quitar like |
| DELETE | `/api/feed/:postId` | Sí | Eliminar post propio |

**Body de `POST /api/feed/publish`:**
```json
{
  "appName": "evily",
  "formType": "evil",
  "content": "I allowed @friend to send me to hell for 30 days. Reciprocity requested.",
  "dataSnapshot": { "person": "friend", "for_days": "30", ... },
  "pointsEarned": 39
}
```

**Respuesta:**
```json
{
  "post": {
    "id": 1,
    "user": { "username": "testuser", "displayName": "Test User", "avatarUrl": "" },
    "appName": "evily",
    "content": "I allowed @friend to send me to hell...",
    "likes": 0,
    "liked": false,
    "mentions": [
      { "username": "friend", "displayName": "Friend User" }
    ],
    "createdAt": "2026-06-07T..."
  }
}
```

### 2.3 `/api/social/` — Follows y notificaciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/social/follow/:userId` | Sí | Seguir usuario |
| DELETE | `/api/social/follow/:userId` | Sí | Dejar de seguir |
| GET | `/api/social/followers/:userId` | No | Seguidores de un usuario |
| GET | `/api/social/following/:userId` | No | Usuarios que sigue |
| GET | `/api/social/notifications` | Sí | Notificaciones propias |
| POST | `/api/social/notifications/read` | Sí | Marcar como leídas |

### 2.4 Parseo de @mentions en backend

Al crear un post, el backend debe:
1. Escanear `content` con regex `@(\w+)`
2. Buscar usuarios por username
3. Crear registros en `mentions`
4. Crear `notifications` para cada usuario mencionado

---

## 3. Frontend — flove-api.js

### 3.1 Nuevas funciones en `window.floveAPI`

```js
// Publicar resultado en feed
async publishPost(appName, formType, content, dataSnapshot, pointsEarned)

// Obtener feed de un usuario
async getUserFeed(username, page = 1)

// Obtener timeline
async getTimeline(page = 1)

// Like / unlike
async likePost(postId)
async unlikePost(postId)

// Follow / unfollow
async followUser(userId)
async unfollowUser(userId)

// Perfil público
async getUserProfile(username)

// Buscar usuarios
async searchUsers(query)

// Notificaciones
async getNotifications()
async markNotificationsRead()

// Parsear @mentions en texto (frontend)
function parseMentions(text)  // devuelve HTML con links a @usuario

// Actualizar perfil
async updateProfile({ bio, websiteUrl })
```

### 3.2 Componente Feed

Agregar en el modal de usuario autenticado una sección de feed:

```
┌──────────────────────────────┐
│  ✺ flove · @testuser        │
│  ✦ 120 pts · nivel 1        │
│                              │
│  [📝 Publicar resultado]     │
│                              │
│ ─── Feed ───                │
│                              │
│ 🧿 evily · hace 2 min       │
│ "I allowed @friend to..."   │
│ ♡ 3  · @friend mentioned    │
│                              │
│ 🧿 souls · hace 1 hora      │
│ "Completed my soul profile" │
│ ♡ 1                         │
│                              │
│ ✦ @user follows you         │
└──────────────────────────────┘
```

### 3.3 Botón "Publicar en feed" en apps

Cada app de metas, trusty, economy, etc. debe tener la opción de publicar el resultado al feed. Esto se integra en el sistema existente de Save/Share/Publish:

```
[💾 Save] [📤 Share] [🌐 Publish] → ya existe
                     ↓
           Nueva opción: "📝 Publicar en mi feed"
           → abre editor con:
             - Preview del resultado
             - Campo de texto (con @autocomplete)
             - Botón [Publicar]
```

### 3.4 Página de perfil público

Ruta: `/profile.html?user=@username`

Template mínimo que carga via `floveAPI.getUserProfile()` + `floveAPI.getUserFeed()` y renderiza:
- Foto/avatar
- @username + display_name
- Bio
- Stats (puntos, nivel, posts)
- Feed de posts
- Botón Follow (si autenticado)

### 3.5 Notificaciones

Campana en el badge inferior derecho (junto al puntaje):
```
[✺ testuser · ✦ 120]  [🔔 3]
```

Al hacer clic, muestra dropdown con notificaciones:
- @alguien te mencionó en "evily"
- @otro empezó a seguirte
- A @fulano le gustó tu post

---

## 4. Integración en apps existentes

### 4.1 metas/goddy.html
- En el handler de `publishBtn` (confirmado), llamar `floveAPI.publishPost('goddy', 'matrix', text, matrixData, points)`
- No tiene forms, pero la matrix de radios es un conjunto de datos publicable

### 4.2 metas/willy.html
- En `pubCommitBtn`, llamar `floveAPI.publishPost('willy', 'commit', clauseText, selectedData, points)`

### 4.3 metas/souls.html
- En `[data-action="publish"]`, llamar `floveAPI.publishPost('souls', 'full', summary, state, points)`
- En `[data-action="finish"]` también

### 4.4 trusty/evily.html
- Ya tiene `scoreEvily()`. Añadir publicación al feed cuando el usuario hace Publish.

### 4.5 trusty/crumbly.html, trusty/daty.html, etc.
- Similar: hook en Publish / Save / Finish

---

## 5. Scoring adicional por actividad social

| Acción | Puntos |
|--------|--------|
| Publicar post en feed | 5 |
| Recibir like | 1 (una vez por post) |
| Recibir follow | 3 |
| Ser mencionado | 2 |
| Llegar a 5 followers | Badge "social_start" |
| Llegar a 10 posts | Badge "social_poster" |

---

## 6. Consideraciones técnicas

- **@mentions en frontend**: input con `contenteditable` o textarea con detección de `@` + autocomplete dropdown de usuarios
- **Paginación**: cursor-based con `created_at` + `id` (no offset)
- **Rate limiting**: máx 10 posts/día por usuario para evitar spam
- **Notificaciones en tiempo real**: idealmente SSE (Server-Sent Events) o polling cada 60s
- **Perfil público sin auth**: cualquiera puede ver `GET /api/users/@:username` y `GET /api/feed/@:username`
- **Borrar posts**: soft-delete o hard-delete (hard es más simple)
- **Cache**: `Cache-Control` en respuestas de feed público (1 min)

---

## 7. Implementación por fases

### Fase 1 (ahora)
- Schema DB (posts, likes, mentions, follows, notifications)
- API routes: feed, users, social
- flove-api.js funciones + parseMentions
- Integrar publish en evily.html y metas (goddy, willy, souls)

### Fase 2 (siguiente)
- Página de perfil público `/profile.html?user=@user`
- Badge de notificaciones
- @autocomplete en editor de posts

### Fase 3 (futuro)
- SSE para notificaciones en tiempo real
- Replies / comentarios en posts
- Compartir posts fuera de flove
- Trending apps / posts
