const LOOKS = {
  skins: ['#a87150', '#8a5634', '#6b4027', '#4f2f1c'],
  hairs: [['short', 'Short'], ['puff', 'Puff'], ['braids', 'Braids'], ['bunches', 'Bunches'], ['bun', 'Bun']],
};

const accounts = {
  all() {
    try { return JSON.parse(localStorage.getItem('its:accounts') || '[]'); } catch { return []; }
  },
  save(list) {
    try { localStorage.setItem('its:accounts', JSON.stringify(list)); } catch {}
  },
  session() {
    try { return localStorage.getItem('its:session'); } catch { return null; }
  },
  setSession(id) {
    try { id ? localStorage.setItem('its:session', id) : localStorage.removeItem('its:session'); } catch {}
  },
  current() {
    const id = this.session();
    return id ? this.all().find((a) => a.id === id) ?? null : null;
  },
  update(id, patch) {
    const list = this.all().map((a) => (a.id === id ? { ...a, ...patch } : a));
    this.save(list);
    return list.find((a) => a.id === id);
  },
};

async function hashPin(id, pin) {
  const data = new TextEncoder().encode(`its:${id}:${pin}`);
  try {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 2166136261;
    for (const c of data) { h ^= c; h = Math.imul(h, 16777619); }
    return `f${(h >>> 0).toString(16)}`;
  }
}

const authEsc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lookOf = (a) => ({ ...PEOPLE.you, skin: a.skin, hair: a.hair, name: a.name });
const failures = new Map();

function applyAccount(a) {
  store.id = a.id;
  PEOPLE.you = { ...PEOPLE.you, skin: a.skin, hair: a.hair };
  const p = store.get();
  p.name = a.name;
  store.set(p);
}

const authRoot = $('#auth');

function authFrame(inner) {
  authRoot.innerHTML = `
    <div class="auth-hero">
      <div class="brand"><span class="logo"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 22c3-1 5-4 7-8 1-2 3-3 5-2l5 3c2 1 3 3 3 5v2H6z"/><path d="M6 25h20"/></svg></span><b>In Their Shoes</b></div>
      <div class="faces">${['eric', 'grace', 'kevin'].map((id, i) => `<span style="--i:${i};--c:${PEOPLE[id].color}">${face(PEOPLE[id], ['tired', 'laugh', 'worried'][i])}</span>`).join('')}</div>
      <h1>See the other side of the story.</h1>
      <p>A social and emotional learning platform. Short stories, a private journal and a daily check-in.</p>
      <p class="meta">Works offline · Everything stays on this device</p>
    </div>
    <div class="auth-card">${inner}</div>`;
}

function showAuth() {
  shell.hidden = true;
  app.hidden = true;
  authRoot.hidden = false;
  store.id = null;
  const list = accounts.all();
  if (!list.length) return signup(true);
  pick();
}

function pick() {
  const list = accounts.all();
  authFrame(`
    <p class="eyebrow">Sign in</p>
    <h2>Who’s playing?</h2>
    <div class="who">
      ${list.map((a) => `<button type="button" class="who-tile" data-acc="${a.id}"><span class="who-face">${face(lookOf(a), 'happy')}</span><b>${authEsc(a.name)}</b><small>${authEsc(a.cls || 'Student')}</small></button>`).join('')}
      <button type="button" class="who-tile add" id="add-acc"><span class="who-face plus">+</span><b>New student</b><small>Create account</small></button>
    </div>`);
  authRoot.querySelectorAll('[data-acc]').forEach((b) => b.addEventListener('click', () => { sfx.pick(); pin(b.dataset.acc); }));
  $('#add-acc').addEventListener('click', () => { sfx.pick(); signup(false); });
}

function pin(id) {
  const a = accounts.all().find((x) => x.id === id);
  if (!a) return pick();
  let entry = '';
  authFrame(`
    <button type="button" class="back" id="back">← Not you?</button>
    <div class="pin-head"><span class="who-face lg">${face(lookOf(a), 'neutral')}</span><h2>Hi, ${authEsc(a.name)}</h2><p class="hint-text" id="pin-msg">Enter your 4-digit PIN</p></div>
    <div class="dots" id="dots">${'<i></i>'.repeat(4)}</div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" data-d="${d}">${d}</button>`).join('')}<span></span><button type="button" data-d="0">0</button><button type="button" data-del aria-label="Delete">⌫</button></div>`);
  const dots = $('#dots');
  const msg = $('#pin-msg');
  const paint = () => dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < entry.length));
  const locked = () => {
    const f = failures.get(id);
    return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0;
  };
  const submit = async () => {
    const wait = locked();
    if (wait) { msg.textContent = `Too many tries. Wait ${wait} seconds.`; entry = ''; paint(); return; }
    const ok = (await hashPin(id, entry)) === a.pin;
    if (ok) {
      failures.delete(id);
      sfx.card();
      dots.classList.add('ok');
      setTimeout(() => login(a), reduced ? 0 : 300);
      return;
    }
    const f = failures.get(id) ?? { n: 0, until: 0 };
    f.n += 1;
    if (f.n >= 5) { f.n = 0; f.until = Date.now() + 30000; }
    failures.set(id, f);
    dots.classList.remove('shake');
    void dots.offsetWidth;
    dots.classList.add('shake');
    msg.textContent = locked() ? 'Too many tries. Wait 30 seconds.' : 'Wrong PIN. Try again.';
    entry = '';
    setTimeout(paint, 250);
  };
  const press = (d) => {
    if (d === 'del') entry = entry.slice(0, -1);
    else if (entry.length < 4) entry += d;
    sfx.tick();
    paint();
    if (entry.length === 4) submit();
  };
  authRoot.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => press(b.dataset.d)));
  authRoot.querySelector('[data-del]').addEventListener('click', () => press('del'));
  $('#back').addEventListener('click', pick);
  authRoot.onkeydown = (e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    if (e.key === 'Backspace') press('del');
  };
  authRoot.tabIndex = -1;
  authRoot.focus({ preventScroll: true });
}

function signup(first) {
  const look = { skin: LOOKS.skins[1], hair: 'short' };
  authFrame(`
    ${first ? '' : '<button type="button" class="back" id="back">← Back</button>'}
    <p class="eyebrow">${first ? 'Welcome' : 'New student'}</p>
    <h2>Create your account</h2>
    <form id="su" class="su" novalidate>
      <div class="su-look">
        <span class="who-face lg" id="su-face"></span>
        <div>
          <label>Skin tone</label>
          <div class="swatches" id="su-skin">${LOOKS.skins.map((c) => `<button type="button" data-skin="${c}" style="--s:${c}" aria-label="Skin tone"></button>`).join('')}</div>
          <label>Hair</label>
          <div class="hairs" id="su-hair">${LOOKS.hairs.map(([k, l]) => `<button type="button" data-hair="${k}">${l}</button>`).join('')}</div>
        </div>
      </div>
      <div class="su-row">
        <div><label for="su-name">First name</label><input id="su-name" maxlength="16" autocomplete="off" placeholder="e.g. Aline"></div>
        <div><label for="su-class">Class <small>(optional)</small></label><input id="su-class" maxlength="12" autocomplete="off" placeholder="e.g. S2 A"></div>
      </div>
      <div class="su-row">
        <div><label for="su-pin">Choose a 4-digit PIN</label><input id="su-pin" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••" type="password"></div>
        <div><label for="su-pin2">Repeat PIN</label><input id="su-pin2" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••" type="password"></div>
      </div>
      <p class="err" id="su-err" role="alert"></p>
      <button class="btn" type="submit">Create account</button>
      <p class="fine">Your account lives only on this computer. Remember your PIN.</p>
    </form>`);
  const paint = () => {
    $('#su-face').innerHTML = face({ ...PEOPLE.you, ...look }, 'happy');
    authRoot.querySelectorAll('[data-skin]').forEach((b) => b.classList.toggle('on', b.dataset.skin === look.skin));
    authRoot.querySelectorAll('[data-hair]').forEach((b) => b.classList.toggle('on', b.dataset.hair === look.hair));
  };
  authRoot.querySelectorAll('[data-skin]').forEach((b) => b.addEventListener('click', () => { look.skin = b.dataset.skin; sfx.tick(); paint(); }));
  authRoot.querySelectorAll('[data-hair]').forEach((b) => b.addEventListener('click', () => { look.hair = b.dataset.hair; sfx.tick(); paint(); }));
  $('#back')?.addEventListener('click', pick);
  paint();
  $('#su-name').focus({ preventScroll: true });
  $('#su').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#su-err');
    const name = cleanName($('#su-name').value);
    const cls = $('#su-class').value.trim().replace(/[<>&"]/g, '').slice(0, 12);
    const p1 = $('#su-pin').value.trim();
    const p2 = $('#su-pin2').value.trim();
    if (!name) { err.textContent = 'Type your first name.'; return $('#su-name').focus(); }
    if (accounts.all().some((a) => a.name.toLowerCase() === name.toLowerCase() && (a.cls || '') === cls)) { err.textContent = 'That name is already used in this class. Add your surname initial.'; return $('#su-name').focus(); }
    if (!/^\d{4}$/.test(p1)) { err.textContent = 'Your PIN must be exactly 4 numbers.'; return $('#su-pin').focus(); }
    if (/^(\d)\1{3}$/.test(p1) || p1 === '1234') { err.textContent = 'That PIN is too easy to guess. Try another.'; return $('#su-pin').focus(); }
    if (p1 !== p2) { err.textContent = 'The two PINs don’t match.'; return $('#su-pin2').focus(); }
    const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const acc = { id, name, cls, skin: look.skin, hair: look.hair, pin: await hashPin(id, p1), created: Date.now() };
    accounts.save(accounts.all().concat(acc));
    sfx.card();
    login(acc);
  });
}

function login(a) {
  accounts.setSession(a.id);
  applyAccount(a);
  authRoot.hidden = true;
  authRoot.innerHTML = '';
  enterApp();
}

function logout() {
  accounts.setSession(null);
  sfx.pick();
  showAuth();
}
