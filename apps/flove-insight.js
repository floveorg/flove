// ✺ flove-insight.js · user-customizable AI insight call
// ----------------------------------------------------------------
// Two modes (both supported):
//   A · default provider — passed via floveShell({ insight: {...} })
//   B · config dialog    — first click opens a form; saved to localStorage
//
// Public API:
//   openInsight(element, defaultProvider) → Promise<string>
//   getStoredConfig() / setStoredConfig() / clearStoredConfig()
// ----------------------------------------------------------------

const STORE_KEY = 'flove.insight.config';

export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setStoredConfig(cfg) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); } catch {}
}

export function clearStoredConfig() {
  try { localStorage.removeItem(STORE_KEY); } catch {}
}

export async function openInsight(element, defaultProvider) {
  const provider = defaultProvider || getStoredConfig();
  if (provider && provider.url) {
    return runInsight(provider, element);
  }
  const cfg = await openConfigDialog();
  if (!cfg) return null;
  setStoredConfig(cfg);
  return runInsight(cfg, element);
}

export async function runInsight(provider, element) {
  const body = JSON.stringify({
    prompt:  provider.prompt || 'Give one short insight about this flove element.',
    element,
  });
  const headers = { 'Content-Type': 'application/json', ...(provider.headers || {}) };
  const res = await fetch(provider.url, { method: 'POST', headers, body });
  if (!res.ok) throw new Error(`insight HTTP ${res.status}`);
  const data = await res.json().catch(() => null);
  return extractText(data);
}

function extractText(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data.text === 'string') return data.text;
  if (typeof data.response === 'string') return data.response;
  if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  if (Array.isArray(data.content) && data.content[0]?.text) {
    return data.content[0].text;
  }
  return JSON.stringify(data, null, 2);
}

// ---- config dialog ---------------------------------------------

function openConfigDialog() {
  return new Promise(resolve => {
    const existing = getStoredConfig() || {};
    const dlg = document.createElement('div');
    dlg.className = 'flove-modal';
    dlg.innerHTML = `
      <div class="flove-modal__backdrop"></div>
      <div class="flove-modal__panel" role="dialog" aria-label="insight provider">
        <h3 class="flove-modal__title">💡 insight · bring your own AI</h3>
        <p class="flove-modal__lede">
          Nothing is sent until you press <em>save and run</em>.
          Saved locally only (this browser).
        </p>
        <label>endpoint URL
          <input name="url" type="url" placeholder="https://api.example.com/v1/chat"
                 value="${esc(existing.url)}" required>
        </label>
        <label>headers (JSON)
          <textarea name="headers" rows="3"
                    placeholder='{ "Authorization": "Bearer …" }'>${esc(existing.headers ? JSON.stringify(existing.headers, null, 2) : '')}</textarea>
        </label>
        <label>prompt template
          <textarea name="prompt" rows="3"
                    placeholder="Give one-paragraph insight about this flove element. Element JSON follows.">${esc(existing.prompt || '')}</textarea>
        </label>
        <div class="flove-modal__row">
          <button type="button" data-act="cancel" class="flove-btn flove-btn--ghost">cancel</button>
          <button type="button" data-act="reset"  class="flove-btn flove-btn--ghost">reset</button>
          <button type="button" data-act="save"   class="flove-btn">save and run</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);

    const close = (value) => { dlg.remove(); resolve(value); };

    dlg.querySelector('[data-act="cancel"]').onclick = () => close(null);
    dlg.querySelector('[data-act="reset"]').onclick  = () => {
      clearStoredConfig();
      dlg.querySelectorAll('input, textarea').forEach(el => el.value = '');
    };
    dlg.querySelector('[data-act="save"]').onclick = () => {
      const url = dlg.querySelector('[name=url]').value.trim();
      if (!url) return;
      let headers = {};
      const hraw = dlg.querySelector('[name=headers]').value.trim();
      if (hraw) {
        try { headers = JSON.parse(hraw); }
        catch { alert('Headers must be valid JSON.'); return; }
      }
      const prompt = dlg.querySelector('[name=prompt]').value.trim();
      close({ url, headers, prompt });
    };
    dlg.querySelector('.flove-modal__backdrop').onclick = () => close(null);
  });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
