const API_BASE = '/api';

let currentUser = null;
let _clickDebounce = {};

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

const apiGet  = (path) => api('GET', path);
const apiPost = (path, body) => api('POST', path, body);
const apiPut  = (path, body) => api('PUT', path, body);
const apiDel  = (path) => api('DELETE', path);

function getAppName() {
  const html = document.documentElement;
  if (html.dataset.floveApp) return html.dataset.floveApp;
  const path = window.location.pathname.replace(/\/+$/, '');
  const match = path.match(/\/([^/]+)\.html$/);
  if (match) return match[1];
  const segs = path.split('/').filter(Boolean);
  return segs[segs.length - 1] || 'home';
}

async function checkSession() {
  try {
    const data = await apiGet('/auth/me');
    currentUser = data;
    return data;
  } catch {
    currentUser = null;
    return null;
  }
}

async function register(username, email, password) {
  const data = await apiPost('/auth/register', { username, email, password });
  currentUser = data.user;
  return data.user;
}

async function login(username, password) {
  const data = await apiPost('/auth/login', { username, password });
  currentUser = data.user;
  return data.user;
}

async function logout() {
  await apiPost('/auth/logout');
  currentUser = null;
}

async function submitForm(appName, formType, data) {
  const result = await apiPost('/forms/submit', { appName, formType, data });
  if (currentUser) {
    currentUser.stats = result.stats;
  }
  return result;
}

async function recordClick(appName, actionType, label) {
  if (!currentUser) return null;
  try {
    const data = await apiPost('/events/click', { appName, actionType, label });
    if (currentUser && data.stats) {
      currentUser.stats = data.stats;
    }
    return data;
  } catch { return null; }
}

async function recordPageView(appName) {
  if (!currentUser) return;
  try {
    const data = await apiPost('/events/pageview', { appName });
    if (data.stats && currentUser) {
      currentUser.stats = data.stats;
    }
  } catch {}
}

async function getMyScores() {
  return apiGet('/scores/me');
}

async function submitFormData(form) {
  const formData = new FormData(form);
  const data = {};
  for (const [key, val] of formData.entries()) {
    if (data[key]) {
      if (!Array.isArray(data[key])) data[key] = [data[key]];
      data[key].push(val);
    } else {
      data[key] = val;
    }
  }
  const appName = form.dataset.app || getAppName();
  const formType = form.dataset.type || form.id || 'form';
  if (Object.keys(data).length === 0) return null;
  const result = await submitForm(appName, formType, data);
  updateBadge();
  return result;
}

let _publishCooldown = {};

function setupAutoForms() {
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!currentUser) return;
    if (form.dataset.floveApi === 'false') return;
    e.preventDefault();
    try {
      const result = await submitFormData(form);
      const evt = new CustomEvent('flove-submit', { detail: result });
      form.dispatchEvent(evt);
      const appName = form.dataset.app || getAppName();
      const cooldownKey = appName + ':publish';
      const now = Date.now();
      if (!_publishCooldown[cooldownKey] || now - _publishCooldown[cooldownKey] > 30000) {
        if (form.dataset.flovePublish !== 'false') {
          _publishCooldown[cooldownKey] = now;
          wireFormPublish(form, result);
        }
      }
    } catch (err) {
      const evt = new CustomEvent('flove-submit-error', { detail: err });
      form.dispatchEvent(evt);
    }
  });
}

function setupClickTracking() {
  if (!currentUser) return;
  const appName = getAppName();

  document.addEventListener('click', (e) => {
    const target = e.target.closest(
      'button:not([data-flove-api="false"]):not([data-flove-click="false"]), ' +
      'a:not([data-flove-api="false"]):not([data-flove-click="false"]), ' +
      'input[type="submit"]:not([data-flove-api="false"]), ' +
      '[data-flove-click]:not([data-flove-click="false"])'
    );
    if (!target) return;
    if (target.closest('#flove-api-modal, #flove-api-badge')) return;

    const label = (
      target.dataset.floveClick
      || target.getAttribute('aria-label')
      || (target.textContent || '').trim().substring(0, 60)
      || target.id
      || target.className
      || 'click'
    ).substring(0, 80);

    const key = appName + ':' + label;
    const now = Date.now();
    if (_clickDebounce[key] && now - _clickDebounce[key] < 3000) return;
    _clickDebounce[key] = now;

    recordClick(appName, 'click', label);
  });
}

function renderModal() {
  const existing = document.getElementById('flove-api-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'flove-api-modal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:99999;
    display:none; align-items:center; justify-content:center;
    background:rgba(0,0,0,.4); backdrop-filter:blur(6px);
    font-family:system-ui,-apple-system,sans-serif;
  `;
  modal.innerHTML = `
    <div style="
      background:#fff; border-radius:20px; padding:2rem;
      max-width:400px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,.2);
      position:relative;
    ">
      <button id="flove-api-close" style="
        position:absolute; top:12px; right:16px;
        background:none; border:none; font-size:1.5rem;
        cursor:pointer; color:#999;
      ">×</button>

      <div id="flove-api-login">
        <h2 style="margin:0 0 1.5rem; font-weight:600;">✺ flove · entrar</h2>
        <input id="flove-login-user" placeholder="usuario o email" style="
          width:100%; padding:12px; margin-bottom:8px; border:1px solid #ddd;
          border-radius:10px; font-size:1rem; box-sizing:border-box;
        ">
        <input id="flove-login-pass" type="password" placeholder="contraseña" style="
          width:100%; padding:12px; margin-bottom:12px; border:1px solid #ddd;
          border-radius:10px; font-size:1rem; box-sizing:border-box;
        ">
        <button id="flove-login-btn" style="
          width:100%; padding:12px; background:#1a1820; color:#fff;
          border:none; border-radius:10px; font-size:1rem; cursor:pointer;
        ">Entrar</button>
        <p style="text-align:center; margin-top:12px; font-size:.9rem; color:#666;">
          ¿No tienes cuenta?
          <a href="#" id="flove-show-register" style="color:#1a1820;">Regístrate</a>
        </p>
        <p id="flove-login-error" style="color:#e44; font-size:.9rem; display:none;"></p>
      </div>

      <div id="flove-api-register" style="display:none;">
        <h2 style="margin:0 0 1.5rem; font-weight:600;">✺ flove · registrarse</h2>
        <input id="flove-reg-user" placeholder="usuario" style="
          width:100%; padding:12px; margin-bottom:8px; border:1px solid #ddd;
          border-radius:10px; font-size:1rem; box-sizing:border-box;
        ">
        <input id="flove-reg-email" type="email" placeholder="email" style="
          width:100%; padding:12px; margin-bottom:8px; border:1px solid #ddd;
          border-radius:10px; font-size:1rem; box-sizing:border-box;
        ">
        <input id="flove-reg-pass" type="password" placeholder="contraseña" style="
          width:100%; padding:12px; margin-bottom:12px; border:1px solid #ddd;
          border-radius:10px; font-size:1rem; box-sizing:border-box;
        ">
        <button id="flove-register-btn" style="
          width:100%; padding:12px; background:#1a1820; color:#fff;
          border:none; border-radius:10px; font-size:1rem; cursor:pointer;
        ">Crear cuenta</button>
        <p style="text-align:center; margin-top:12px; font-size:.9rem; color:#666;">
          ¿Ya tienes cuenta?
          <a href="#" id="flove-show-login" style="color:#1a1820;">Entra</a>
        </p>
        <p id="flove-register-error" style="color:#e44; font-size:.9rem; display:none;"></p>
      </div>

      <div id="flove-api-authenticated" style="display:none;">
        <div style="text-align:center;">
          <div id="flove-avatar" style="
            width:64px; height:64px; border-radius:50%; background:#eee;
            margin:0 auto 8px; display:flex; align-items:center; justify-content:center;
            font-size:1.5rem; color:#999;
          ">✺</div>
          <h3 id="flove-display-name" style="margin:0; font-weight:600;"></h3>
          <p id="flove-username-tag" style="margin:0 0 4px; font-size:.85rem; color:#999;"></p>
          <p id="flove-user-bio" style="margin:0 0 8px; font-size:.85rem; color:#666; font-style:italic;"></p>
          <p id="flove-user-stats" style="margin:0 0 4px; font-size:.9rem; color:#666;"></p>
          <p id="flove-user-social" style="margin:0 0 8px; font-size:.85rem; color:#999;"></p>
          <p id="flove-created-at" style="margin:0 0 12px; font-size:.75rem; color:#bbb;"></p>
          <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:12px;">
            <button id="flove-profile-edit-btn" style="
              padding:6px 16px; background:#eee; color:#1a1820;
              border:none; border-radius:8px; font-size:.85rem; cursor:pointer;
            ">✎ Editar perfil</button>
            <button id="flove-profile-feed-btn" style="
              padding:6px 16px; background:#1a1820; color:#fff;
              border:none; border-radius:8px; font-size:.85rem; cursor:pointer;
            ">📰 Mi feed</button>
            <button id="flove-profile-friends-btn" style="
              padding:6px 16px; background:#eee; color:#1a1820;
              border:none; border-radius:8px; font-size:.85rem; cursor:pointer;
            ">👥 Amigos</button>
            <button id="flove-logout-btn" style="
              padding:6px 16px; background:#ddd; color:#666;
              border:none; border-radius:8px; font-size:.85rem; cursor:pointer;
            ">Salir</button>
          </div>
          <div id="flove-profile-edit-form" style="display:none; text-align:left; border-top:1px solid #eee; padding-top:12px; margin-top:4px;">
            <input id="flove-edit-name" placeholder="Nombre visible" style="
              width:100%; padding:10px; margin-bottom:6px; border:1px solid #ddd;
              border-radius:8px; font-size:.9rem; box-sizing:border-box;
            ">
            <input id="flove-edit-bio" placeholder="Bio" style="
              width:100%; padding:10px; margin-bottom:6px; border:1px solid #ddd;
              border-radius:8px; font-size:.9rem; box-sizing:border-box;
            ">
            <input id="flove-edit-avatar" placeholder="URL de avatar" style="
              width:100%; padding:10px; margin-bottom:6px; border:1px solid #ddd;
              border-radius:8px; font-size:.9rem; box-sizing:border-box;
            ">
            <input id="flove-edit-website" placeholder="Web" style="
              width:100%; padding:10px; margin-bottom:8px; border:1px solid #ddd;
              border-radius:8px; font-size:.9rem; box-sizing:border-box;
            ">
            <div style="display:flex; gap:6px; justify-content:flex-end;">
              <button id="flove-edit-cancel" style="
                padding:8px 18px; background:#eee; color:#1a1820;
                border:none; border-radius:8px; font-size:.85rem; cursor:pointer;
              ">Cancelar</button>
              <button id="flove-edit-save" style="
                padding:8px 18px; background:#1a1820; color:#fff;
                border:none; border-radius:8px; font-size:.85rem; cursor:pointer;
              ">Guardar</button>
            </div>
            <p id="flove-edit-error" style="color:#e44; font-size:.85rem; display:none; margin-top:6px;"></p>
          </div>
          <div id="flove-profile-feed" style="display:none; text-align:left; border-top:1px solid #eee; padding-top:10px; margin-top:4px; max-height:240px; overflow-y:auto;">
            <p style="margin:0 0 6px; font-size:.8rem; color:#999; font-weight:600;">📰 Mis publicaciones</p>
            <div id="flove-feed-list"></div>
            <p id="flove-feed-loading" style="font-size:.8rem; color:#bbb; text-align:center;">Cargando...</p>
          </div>
          <div id="flove-profile-friends" style="display:none; text-align:left; border-top:1px solid #eee; padding-top:10px; margin-top:4px; max-height:240px; overflow-y:auto;">
            <p style="margin:0 0 6px; font-size:.8rem; color:#999; font-weight:600;">👥 Siguiendo</p>
            <div id="flove-friends-list"></div>
            <p id="flove-friends-loading" style="font-size:.8rem; color:#bbb; text-align:center;">Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('flove-api-close').onclick = () => hideModal();
  modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

  document.getElementById('flove-login-btn').onclick = async () => {
    const user = document.getElementById('flove-login-user').value.trim();
    const pass = document.getElementById('flove-login-pass').value;
    const err = document.getElementById('flove-login-error');
    err.style.display = 'none';
    try {
      await login(user, pass);
      hideModal();
      updateBadge();
    } catch (e) {
      err.textContent = e.error || 'Error al entrar';
      err.style.display = 'block';
    }
  };

  document.getElementById('flove-register-btn').onclick = async () => {
    const user = document.getElementById('flove-reg-user').value.trim();
    const email = document.getElementById('flove-reg-email').value.trim();
    const pass = document.getElementById('flove-reg-pass').value;
    const err = document.getElementById('flove-register-error');
    err.style.display = 'none';
    try {
      await register(user, email, pass);
      hideModal();
      updateBadge();
    } catch (e) {
      err.textContent = e.error || 'Error al registrarse';
      err.style.display = 'block';
    }
  };

  document.getElementById('flove-show-register').onclick = (e) => {
    e.preventDefault();
    document.getElementById('flove-api-login').style.display = 'none';
    document.getElementById('flove-api-register').style.display = 'block';
  };

  document.getElementById('flove-show-login').onclick = (e) => {
    e.preventDefault();
    document.getElementById('flove-api-register').style.display = 'none';
    document.getElementById('flove-api-login').style.display = 'block';
  };

  document.getElementById('flove-logout-btn').onclick = async () => {
    await logout();
    hideModal();
    updateBadge();
  };

  document.getElementById('flove-profile-edit-btn').onclick = () => {
    const form = document.getElementById('flove-profile-edit-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    document.getElementById('flove-edit-name').value = currentUser.displayName || '';
    document.getElementById('flove-edit-bio').value = currentUser.bio || '';
    document.getElementById('flove-edit-avatar').value = currentUser.avatarUrl || '';
    document.getElementById('flove-edit-website').value = currentUser.websiteUrl || '';
  };

  document.getElementById('flove-edit-cancel').onclick = () => {
    document.getElementById('flove-profile-edit-form').style.display = 'none';
  };

  document.getElementById('flove-edit-save').onclick = async () => {
    const errEl = document.getElementById('flove-edit-error');
    errEl.style.display = 'none';
    try {
      const result = await updateProfile({
        displayName: document.getElementById('flove-edit-name').value.trim(),
        bio: document.getElementById('flove-edit-bio').value.trim(),
        avatarUrl: document.getElementById('flove-edit-avatar').value.trim(),
        websiteUrl: document.getElementById('flove-edit-website').value.trim(),
      });
      currentUser.displayName = result.displayName;
      currentUser.bio = result.bio;
      currentUser.avatarUrl = result.avatarUrl;
      currentUser.websiteUrl = result.websiteUrl;
      document.getElementById('flove-profile-edit-form').style.display = 'none';
      updateBadge();
      showAuthenticated();
    } catch (e) {
      errEl.textContent = e.error || 'Error al guardar';
      errEl.style.display = 'block';
    }
  };

  document.getElementById('flove-profile-feed-btn').onclick = async () => {
    const panel = document.getElementById('flove-profile-feed');
    const list = document.getElementById('flove-feed-list');
    const loading = document.getElementById('flove-feed-loading');
    document.getElementById('flove-profile-friends').style.display = 'none';
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    loading.style.display = 'block';
    list.innerHTML = '';
    try {
      const data = await getUserFeed(currentUser.username);
      loading.style.display = 'none';
      if (!data.posts || data.posts.length === 0) {
        list.innerHTML = '<p style="font-size:.8rem;color:#bbb;text-align:center;">Sin publicaciones aún</p>';
        return;
      }
      for (const p of data.posts.slice(0, 10)) {
        const d = document.createElement('div');
        d.style.cssText = 'padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:.82rem;';
        d.innerHTML = `
          <span style="font-weight:600;">${p.appName}</span>
          <span style="color:#999;font-size:.75rem;"> · ${new Date(p.createdAt).toLocaleDateString()}</span>
          <span style="color:#888;"> ✦${p.pointsEarned}</span>
          <p style="margin:2px 0 0;color:#666;font-size:.8rem;">${p.content ? floveAPI.parseMentions(p.content.substring(0,120)) : ''}</p>
          <span style="font-size:.75rem;color:#bbb;">♡ ${p.likes}</span>
        `;
        list.appendChild(d);
      }
    } catch {
      loading.textContent = 'Error al cargar feed';
    }
  };

  document.getElementById('flove-profile-friends-btn').onclick = async () => {
    const panel = document.getElementById('flove-profile-friends');
    const list = document.getElementById('flove-friends-list');
    const loading = document.getElementById('flove-friends-loading');
    document.getElementById('flove-profile-feed').style.display = 'none';
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    loading.style.display = 'block';
    list.innerHTML = '';
    try {
      const uid = currentUser.id;
      const [followers, following] = await Promise.all([
        getFollowers(uid),
        getFollowing(uid),
      ]);
      loading.style.display = 'none';
      const users = following.following || [];
      const allUsers = [...users, ...(followers.followers || [])];
      const seen = new Set();
      const unique = [];
      for (const u of allUsers) {
        if (!seen.has(u.id)) { seen.add(u.id); unique.push(u); }
      }
      if (unique.length === 0) {
        list.innerHTML = '<p style="font-size:.8rem;color:#bbb;text-align:center;">Sin conexiones aún</p>';
        return;
      }
      for (const u of unique) {
        const d = document.createElement('div');
        d.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:.82rem;';
        d.innerHTML = `
          <span style="font-weight:600;">@${u.username}</span>
          <span style="color:#666;">${u.display_name || ''}</span>
          <span style="margin-left:auto;color:#999;font-size:.75rem;">✦ ${u.total_points || 0}</span>
        `;
        list.appendChild(d);
      }
    } catch {
      loading.textContent = 'Error al cargar amigos';
    }
  };

  if (currentUser) {
    showAuthenticated();
  }
}

async function showAuthenticated() {
  document.getElementById('flove-api-login').style.display = 'none';
  document.getElementById('flove-api-register').style.display = 'none';
  const authed = document.getElementById('flove-api-authenticated');
  authed.style.display = 'block';

  try {
    const profile = await apiGet('/auth/me');
    Object.assign(currentUser, profile);
  } catch {}

  document.getElementById('flove-display-name').textContent =
    currentUser.displayName || currentUser.username;
  document.getElementById('flove-username-tag').textContent =
    `@${currentUser.username}`;
  document.getElementById('flove-user-bio').textContent =
    currentUser.bio || '';
  document.getElementById('flove-user-bio').style.display =
    currentUser.bio ? 'block' : 'none';

  const stats = currentUser.stats || {};
  document.getElementById('flove-user-stats').textContent =
    `✦ ${stats.totalPoints || 0} pts · nivel ${stats.level || 1} · ${stats.submissionCount || 0} envíos`;
  document.getElementById('flove-user-social').textContent =
    `📰 ${stats.postCount || 0} posts · 👥 ${stats.followerCount || 0} seguidores · ${stats.followingCount || 0} siguiendo`;

  if (currentUser.createdAt) {
    const d = new Date(currentUser.createdAt);
    document.getElementById('flove-created-at').textContent =
      `Desde ${d.toLocaleDateString()}`;
  }

  const avatar = document.getElementById('flove-avatar');
  if (currentUser.avatarUrl) {
    avatar.innerHTML = `<img src="${currentUser.avatarUrl}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">`;
  } else {
    avatar.textContent = '✺';
  }
}

function showModal() {
  renderModal();
  const modal = document.getElementById('flove-api-modal');
  if (currentUser) showAuthenticated();
  modal.style.display = 'flex';
}

function hideModal() {
  const modal = document.getElementById('flove-api-modal');
  if (modal) modal.style.display = 'none';
}

function renderBadge() {
  const existing = document.getElementById('flove-api-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'flove-api-badge';
  badge.style.cssText = `
    position:fixed; bottom:20px; right:20px; z-index:99998;
    display:flex; align-items:center; gap:8px;
    padding:8px 16px 8px 12px;
    background:rgba(255,255,255,.85); backdrop-filter:blur(12px);
    border:1px solid rgba(0,0,0,.08); border-radius:100px;
    box-shadow:0 4px 16px rgba(0,0,0,.1);
    cursor:pointer; font-family:system-ui,-apple-system,sans-serif;
    font-size:13px;
    transition:transform .15s;
  `;
  badge.onmouseenter = () => badge.style.transform = 'scale(1.05)';
  badge.onmouseleave = () => badge.style.transform = 'scale(1)';

  if (currentUser) {
    const s = currentUser.stats || {};
    const avatarHtml = currentUser.avatarUrl
      ? `<img src="${currentUser.avatarUrl}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;">`
      : `<span style="font-size:1.2rem;">✺</span>`;
    badge.innerHTML = `
      ${avatarHtml}
      <span style="font-weight:500;">${currentUser.displayName || currentUser.username}</span>
      <span style="color:#888;">·</span>
      <span style="font-weight:600;">✦ ${s.totalPoints || 0}</span>
    `;
    badge.onclick = () => showModal();
  } else {
    badge.innerHTML = `
      <span style="font-size:1.2rem;">✺</span>
      <span style="font-weight:500;">Entrar</span>
    `;
    badge.onclick = () => showModal();
  }

  document.body.appendChild(badge);
}

async function updateBadge() {
  if (currentUser) {
    try {
      const data = await getMyScores();
      currentUser.stats = data;
    } catch {}
  }
  renderBadge();
}

async function init(options = {}) {
  await checkSession();
  renderBadge();

  if (currentUser) {
    const appName = getAppName();
    recordPageView(appName);
    setupClickTracking();
  }

  setupAutoForms();
  setupDeclarativePublish();
  renderPublishFloat();
}

function setupDeclarativePublish() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-flove-publish]');
    if (!btn) return;
    if (!currentUser) { showModal(); return; }
    e.preventDefault();
    const appName = btn.dataset.flovePublish || getAppName();
    const formType = btn.dataset.floveFormtype || 'result';
    let dataSnapshot = {};
    try {
      dataSnapshot = JSON.parse(btn.dataset.floveData || '{}');
    } catch {}
    const points = parseInt(btn.dataset.flovePoints) || 10;
    showFeedPublishModal(appName, formType, dataSnapshot, points);
  });
}

function renderPublishFloat() {
  const existing = document.getElementById('flove-api-publish-float');
  if (existing) existing.remove();
  if (!currentUser) return;

  const appName = getAppName();
  const skipPages = ['home', 'apps', 'index', 'apps.html', 'profile'];
  if (skipPages.includes(appName) || appName === '') return;

  const btn = document.createElement('div');
  btn.id = 'flove-api-publish-float';
  btn.setAttribute('data-flove-click', 'false');
  btn.style.cssText = `
    position:fixed; bottom:76px; right:20px; z-index:99997;
    width:40px; height:40px; border-radius:50%;
    background:rgba(255,255,255,.9); backdrop-filter:blur(12px);
    border:1px solid rgba(0,0,0,.08);
    box-shadow:0 4px 16px rgba(0,0,0,.1);
    display:flex; align-items:center; justify-content:center;
    font-size:18px; cursor:pointer;
    transition:transform .15s;
    font-family:system-ui,-apple-system,sans-serif;
  `;
  btn.textContent = '📝';
  btn.title = 'Publicar resultado en mi feed';
  btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseleave = () => btn.style.transform = 'scale(1)';
  btn.onclick = async () => {
    if (!currentUser) { showModal(); return; }
    const collected = collectAppData();
    showFeedPublishModal(collected.appName, collected.formType, collected.data, collected.points);
  };
  document.body.appendChild(btn);
}

function collectAppData() {
  const appName = getAppName();
  const forms = document.querySelectorAll('form');
  const data = {};
  let formType = 'page';

  if (forms.length > 0) {
    for (const form of forms) {
      const fd = new FormData(form);
      for (const [k, v] of fd.entries()) {
        if (data[k]) {
          if (!Array.isArray(data[k])) data[k] = [data[k]];
          data[k].push(v);
        } else {
          data[k] = v;
        }
      }
      formType = form.dataset.type || form.id || form.name || formType;
    }
  }

  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  for (const el of inputs) {
    if (el.name && !data[el.name]) {
      data[el.name] = el.value;
    }
  }

  const title = document.querySelector('h1, h2, .title, .app-title');
  if (title) data._title = title.textContent.trim();

  const fieldCount = Object.keys(data).filter(k => !k.startsWith('_')).length;
  const points = Math.max(10, fieldCount * 2);

  return { appName, formType: formType || 'result', data, points };
}

function wireFormPublish(form, result) {
  if (!currentUser || !form || !result) return;
  if (form.dataset.flovePublish === 'false') return;
  const appName = form.dataset.app || getAppName();
  const formType = form.dataset.type || form.id || 'form';
  const data = {};
  const fd = new FormData(form);
  for (const [k, v] of fd.entries()) {
    if (data[k]) {
      if (!Array.isArray(data[k])) data[k] = [data[k]];
      data[k].push(v);
    } else {
      data[k] = v;
    }
  }
  const hasChanges = Object.keys(data).length > 0;
  if (!hasChanges) return;
  setTimeout(() => {
    showFeedPublishModal(appName, formType, data, result.points || 10);
  }, 500);
}

async function publishPost(appName, formType, content, dataSnapshot, pointsEarned) {
  return apiPost('/feed/publish', { appName, formType, content, dataSnapshot, pointsEarned });
}

async function getUserFeed(username, page = 1) {
  return apiGet(`/feed/@${username}?page=${page}`);
}

async function getTimeline(page = 1) {
  return apiGet(`/feed/timeline?page=${page}`);
}

async function likePost(postId) {
  return apiPost(`/feed/like/${postId}`);
}

async function unlikePost(postId) {
  return apiDel(`/feed/like/${postId}`);
}

async function deletePost(postId) {
  return apiDel(`/feed/${postId}`);
}

async function getUserProfile(username) {
  return apiGet(`/users/@${username}`);
}

async function searchUsers(query) {
  return apiGet(`/users/search?q=${encodeURIComponent(query)}`);
}

async function followUser(userId) {
  return apiPost(`/social/follow/${userId}`);
}

async function unfollowUser(userId) {
  return apiDel(`/social/follow/${userId}`);
}

async function getFollowers(userId) {
  return apiGet(`/social/followers/${userId}`);
}

async function getFollowing(userId) {
  return apiGet(`/social/following/${userId}`);
}

async function getNotifications() {
  return apiGet('/social/notifications');
}

async function markNotificationsRead(ids) {
  return apiPost('/social/notifications/read', { ids });
}

async function updateProfile(data) {
  return apiPut('/auth/profile', data);
}

function showFeedPublishModal(appName, formType, dataSnapshot, pointsEarned) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:100000;
    display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,.4); backdrop-filter:blur(6px);
    font-family:system-ui,-apple-system,sans-serif;
  `;
  overlay.innerHTML = `
    <div style="
      background:#fff; border-radius:20px; padding:2rem;
      max-width:440px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,.2);
      position:relative;
    ">
      <h3 style="margin:0 0 .5rem; font-weight:600;">📝 Publicar en mi feed</h3>
      <p style="margin:0 0 1rem; font-size:.9rem; color:#666;">
        App: <strong>${appName}</strong> · ✦ ${pointsEarned} pts
      </p>
      <textarea id="flove-feed-content" placeholder="Escribe algo... (usa @usuario para mencionar)"
        style="width:100%; min-height:80px; padding:12px; border:1px solid #ddd; border-radius:10px;
               font-size:.95rem; font-family:inherit; box-sizing:border-box; resize:vertical;
      "></textarea>
      <p id="flove-feed-mentions" style="margin:4px 0 12px; font-size:.85rem; color:#999; min-height:1.2em;"></p>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="flove-feed-cancel" style="
          padding:10px 20px; background:#eee; color:#1a1820; border:none;
          border-radius:10px; font-size:.95rem; cursor:pointer;
        ">Cancelar</button>
        <button id="flove-feed-submit" style="
          padding:10px 20px; background:#1a1820; color:#fff; border:none;
          border-radius:10px; font-size:.95rem; cursor:pointer;
        ">Publicar</button>
      </div>
      <p id="flove-feed-error" style="color:#e44; font-size:.9rem; display:none; margin-top:8px;"></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const textarea = overlay.querySelector('#flove-feed-content');

  textarea.addEventListener('input', () => {
    const mentions = textarea.value.match(/@(\w+)/g);
    const preview = overlay.querySelector('#flove-feed-mentions');
    if (mentions) {
      preview.textContent = mentions.join(' · ');
    } else {
      preview.textContent = '';
    }
  });

  overlay.querySelector('#flove-feed-cancel').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#flove-feed-submit').onclick = async () => {
    const content = textarea.value.trim();
    const errEl = overlay.querySelector('#flove-feed-error');
    errEl.style.display = 'none';
    try {
      await publishPost(appName, formType, content, dataSnapshot, pointsEarned);
      overlay.remove();
    } catch (e) {
      errEl.textContent = e.error || 'Error al publicar';
      errEl.style.display = 'block';
    }
  };
}

function parseMentions(text) {
  if (!text) return '';
  return text.replace(/@(\w+)/g, '<a href="/profile.html?user=@$1" style="color:#1a1820;font-weight:500;">@$1</a>');
}

window.floveAPI = {
  init,
  checkSession,
  login,
  register,
  logout,
  submitForm,
  getMyScores,
  recordClick,
  recordPageView,
  getAppName,
  showModal,
  hideModal,
  updateBadge,
  publishPost,
  getUserFeed,
  getTimeline,
  likePost,
  unlikePost,
  deletePost,
  getUserProfile,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getNotifications,
  markNotificationsRead,
  updateProfile,
  showFeedPublishModal,
  parseMentions,
  collectAppData,
  setupDeclarativePublish,
  renderPublishFloat,
  wireFormPublish,
  get currentUser() { return currentUser; },
};
