const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get() {
    try { return JSON.parse(localStorage.getItem('its:progress') || '{}'); } catch { return {}; }
  },
  set(v) {
    try { localStorage.setItem('its:progress', JSON.stringify(v)); } catch {}
  },
};

const state = { name: '', vars: {}, journal: [], shoes: null, cast: [], chapter: 0, muted: false };

const ui = {
  app: $('#app'),
  bgA: $('#bg-a'),
  bgB: $('#bg-b'),
  tint: $('#tint'),
  cast: $('#cast'),
  box: $('#box'),
  tag: $('#tag'),
  text: $('#text'),
  hint: $('#hint'),
  choices: $('#choices'),
  overlay: $('#overlay'),
  time: $('#time'),
  chapter: $('#chapter-label'),
  shoes: $('#shoes'),
  hud: $('#hud'),
  sound: $('#sound'),
};

let audio;
function tone(freq, dur = 0.12, type = 'sine', gain = 0.05, when = 0) {
  if (state.muted) return;
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime + when;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {}
}
const sfx = {
  pick: () => tone(660, 0.1, 'triangle', 0.05),
  flip: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.35, 'sine', 0.045, i * 0.07)),
  card: () => [523, 659, 784].forEach((f, i) => tone(f, 0.6, 'triangle', 0.04, i * 0.12)),
  tick: () => tone(1200, 0.02, 'square', 0.006),
};

const fmt = (t) => t.replace(/\{(\w+)\}/g, (m, k) => (k === 'name' ? state.name : state.vars[k]?.text ?? m));

function person(id) {
  if (id === 'you') return { ...PEOPLE.you, name: state.name };
  return PEOPLE[id];
}

function speakerName(id) {
  if (id === 'self') return state.shoes ? `You · ${PEOPLE[state.shoes].name}` : 'You';
  return person(id)?.name ?? '';
}

function speakerColor(id) {
  if (id === 'self') return state.shoes ? PEOPLE[state.shoes].color : PEOPLE.you.color;
  return person(id)?.color ?? '#555';
}

let onAdvance = null;
function advance() {
  if (onAdvance) onAdvance();
}

ui.app.addEventListener('click', (e) => {
  if (e.target.closest('button, input, textarea, a, .overlay')) return;
  advance();
});
addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea')) return;
  if (e.key === ' ' || e.key === 'Enter') {
    if (document.activeElement?.tagName === 'BUTTON') return;
    e.preventDefault();
    advance();
  }
  if (/^[1-3]$/.test(e.key)) {
    const b = ui.choices.querySelectorAll('button')[Number(e.key) - 1] ?? ui.overlay.querySelectorAll('.option')[Number(e.key) - 1];
    b?.click();
  }
});

let bgFront = 'a';
function setScene(key, chalk, time) {
  const next = bgFront === 'a' ? ui.bgB : ui.bgA;
  const cur = bgFront === 'a' ? ui.bgA : ui.bgB;
  next.innerHTML = scene(key, chalk);
  next.classList.add('show');
  cur.classList.remove('show');
  bgFront = bgFront === 'a' ? 'b' : 'a';
  if (time) setTime(time);
}

function setTime(t) {
  ui.time.textContent = t;
  ui.time.classList.remove('pop');
  void ui.time.offsetWidth;
  ui.time.classList.add('pop');
}

function setCast(list) {
  const keep = new Set(list.map((c) => c.id));
  for (const node of [...ui.cast.children]) {
    if (!keep.has(node.dataset.id)) {
      node.classList.add('leave');
      setTimeout(() => node.remove(), reduced ? 0 : 350);
    }
  }
  for (const c of list) {
    let node = ui.cast.querySelector(`[data-id="${c.id}"]:not(.leave)`);
    if (!node) {
      node = el('figure', 'actor enter');
      node.dataset.id = c.id;
      node.innerHTML = `<div class="portrait"></div><figcaption></figcaption>`;
      ui.cast.append(node);
      requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('enter')));
    }
    const p = person(c.id);
    node.querySelector('figcaption').textContent = p.name;
    node.style.setProperty('--c', p.color);
    setMood(c.id, c.mood);
  }
  state.cast = list;
}

function setMood(id, mood) {
  const node = ui.cast.querySelector(`[data-id="${id}"]:not(.leave)`);
  if (!node) return;
  const p = person(id);
  if (node.dataset.mood === mood) return;
  node.dataset.mood = mood;
  node.querySelector('.portrait').innerHTML = face(p, mood);
  node.classList.remove('bump');
  void node.offsetWidth;
  node.classList.add('bump');
}

function highlight(id) {
  for (const node of ui.cast.children) node.classList.toggle('speaking', node.dataset.id === id);
  ui.cast.classList.toggle('focus', !!id && !!ui.cast.querySelector(`[data-id="${id}"]`));
}

async function line(kind, who, raw) {
  const full = fmt(raw);
  ui.box.className = `box ${kind}`;
  ui.choices.innerHTML = '';
  ui.box.hidden = false;
  if (kind === 'say') {
    ui.tag.textContent = speakerName(who);
    ui.tag.style.setProperty('--c', speakerColor(who));
    ui.tag.hidden = false;
  } else if (kind === 'think') {
    ui.tag.textContent = state.shoes ? `${PEOPLE[state.shoes].name} thinks` : 'You think';
    ui.tag.style.setProperty('--c', state.shoes ? PEOPLE[state.shoes].color : PEOPLE.you.color);
    ui.tag.hidden = false;
  } else ui.tag.hidden = true;
  highlight(kind === 'say' ? who : null);
  ui.hint.classList.remove('show');
  ui.text.textContent = '';
  let done = false;
  await new Promise((res) => {
    let i = 0;
    const speed = reduced ? 0 : 22;
    onAdvance = () => { done = true; };
    const tick = () => {
      if (done || speed === 0) i = full.length;
      ui.text.textContent = full.slice(0, i);
      if (i >= full.length) return res();
      if (i % 3 === 0) sfx.tick();
      i += 1;
      setTimeout(tick, full[i - 1] === '.' || full[i - 1] === '?' ? speed * 6 : speed);
    };
    tick();
  });
  ui.hint.classList.add('show');
  await new Promise((res) => { onAdvance = res; });
  onAdvance = null;
  sfx.tick();
}

function choose(options) {
  return new Promise((res) => {
    ui.box.className = 'box choosing';
    ui.box.hidden = false;
    ui.tag.hidden = false;
    ui.tag.textContent = state.shoes ? `What does ${PEOPLE[state.shoes].name} do?` : 'What do you do?';
    ui.tag.style.setProperty('--c', state.shoes ? PEOPLE[state.shoes].color : PEOPLE.you.color);
    ui.text.textContent = '';
    ui.hint.classList.remove('show');
    highlight(null);
    ui.choices.innerHTML = '';
    options.forEach((o, i) => {
      const b = el('button', 'choice', `<kbd>${i + 1}</kbd><span>${fmt(o.text)}</span>`);
      b.style.animationDelay = `${i * 70}ms`;
      b.addEventListener('click', () => {
        sfx.pick();
        ui.choices.querySelectorAll('button').forEach((x) => (x.disabled = true));
        b.classList.add('picked');
        setTimeout(() => { ui.choices.innerHTML = ''; res(i); }, reduced ? 0 : 380);
      }, { once: true });
      ui.choices.append(b);
    });
    ui.choices.querySelector('button')?.focus({ preventScroll: true });
  });
}

function overlay(html, cls = '') {
  ui.overlay.className = `overlay show ${cls}`;
  ui.overlay.innerHTML = html;
  ui.box.hidden = true;
  return ui.overlay;
}

async function closeOverlay() {
  ui.overlay.classList.add('out');
  await sleep(reduced ? 0 : 420);
  ui.overlay.className = 'overlay';
  ui.overlay.innerHTML = '';
}

function waitButton(root, sel = '[data-go]') {
  return new Promise((res) => {
    const b = root.querySelector(sel);
    b.focus({ preventScroll: true });
    b.addEventListener('click', () => { sfx.pick(); res(); }, { once: true });
  });
}

function judge(j) {
  return new Promise((res) => {
    const o = overlay(`
      <div class="sheet judge">
        <p class="eyebrow">Only you will see this</p>
        <h2>${fmt(j.q)}</h2>
        <div class="options">${j.options.map((t, i) => `<button class="option" data-i="${i}"><kbd>${i + 1}</kbd>${t}</button>`).join('')}</div>
      </div>`, 'paper');
    o.querySelectorAll('.option').forEach((b) =>
      b.addEventListener('click', async () => {
        sfx.pick();
        b.classList.add('picked');
        o.querySelectorAll('.option').forEach((x) => (x.disabled = true));
        await sleep(reduced ? 0 : 500);
        await closeOverlay();
        res(Number(b.dataset.i));
      }, { once: true }));
    o.querySelector('.option').focus({ preventScroll: true });
  });
}

async function flipTo(id, text) {
  sfx.flip();
  const p = id ? PEOPLE[id] : { ...PEOPLE.you, name: state.name };
  const o = overlay(`
    <div class="flip">
      <div class="flip-face" style="--c:${p.color}">${face(p, 'neutral')}</div>
      <p class="eyebrow">${id ? 'Switch' : 'Switch back'}</p>
      <h2>${fmt(text)}</h2>
      <button class="btn" data-go>${id ? `Step into ${p.name}’s shoes` : 'Continue'}</button>
    </div>`, id ? 'switching' : 'returning');
  o.style.setProperty('--c', p.color);
  ui.app.classList.add('turning');
  await waitButton(o);
  state.shoes = id;
  ui.app.classList.toggle('in-shoes', !!id);
  ui.app.style.setProperty('--shoes', id ? PEOPLE[id].color : PEOPLE.you.color);
  ui.shoes.hidden = !id;
  if (id) ui.shoes.innerHTML = `<span class="mini">${face(PEOPLE[id], 'neutral')}</span>You are ${PEOPLE[id].name}`;
  setCast([]);
  await closeOverlay();
  ui.app.classList.remove('turning');
}

async function revealCard(c, chapter) {
  sfx.card();
  const p = PEOPLE[chapter.other];
  const open = state.vars[c.judged]?.i === 2;
  const card = { title: chapter.title, skill: chapter.skill, other: chapter.other, open, thought: fmt(c.thought), truth: fmt(c.truth), lesson: fmt(c.lesson) };
  state.journal = state.journal.filter((x) => x.title !== card.title).concat(card);
  const o = overlay(`
    <div class="sheet reveal" style="--c:${p.color}">
      <p class="eyebrow">${chapter.skill}</p>
      <div class="pair">
        <div class="side before ${open ? 'open' : ''}"><span>${open ? 'You stayed open' : 'What you thought'}</span><p>“${card.thought}”</p></div>
        <div class="side after"><span>What was true</span><p>${card.truth}</p></div>
      </div>
      <h2>${card.lesson}</h2>
      <button class="btn" data-go>Continue</button>
    </div>`, 'paper');
  await waitButton(o);
  await closeOverlay();
}

async function chapterCard(n, ch) {
  ui.chapter.textContent = `${n + 1} · ${ch.title}`;
  const o = overlay(`
    <div class="title-card">
      <p class="eyebrow">Story ${n + 1} of ${CHAPTERS.length}</p>
      <h1>${ch.title}</h1>
      <p class="sub">${ch.skill}</p>
      <button class="btn" data-go>Begin</button>
    </div>`, 'dark');
  await waitButton(o);
  await closeOverlay();
}

async function step(b, ch) {
  if (b.bg) return setScene(b.bg, b.chalk, b.time);
  if (b.time) return setTime(b.time);
  if (b.cast) return setCast(b.cast);
  if (Array.isArray(b.mood)) { setMood(b.mood[0], b.mood[1]); return sleep(reduced ? 0 : 250); }
  if (b.narr) return line('narr', null, b.narr);
  if (b.think) return line('think', null, b.think);
  if (b.say) {
    if (b.mood) setMood(b.say, b.mood);
    return line('say', b.say, b.text);
  }
  if (b.choose) {
    const i = await choose(b.choose);
    if (b.save) state.vars[b.save] = { i, text: b.choose[i].text };
    return run(b.choose[i].then ?? [], ch);
  }
  if (b.judge) {
    const i = await judge(b.judge);
    state.vars[b.save] = { i, text: b.judge.options[i] };
    return;
  }
  if (b.when) return run(b.cases[state.vars[b.when]?.i ?? 0] ?? [], ch);
  if (b.switch) return flipTo(b.switch, b.text);
  if (b.back) return flipTo(null, b.text);
  if (b.card) return revealCard(b.card, ch);
}

async function run(beats, ch) {
  for (const b of beats) await step(b, ch);
}

async function playChapter(n) {
  const ch = CHAPTERS[n];
  state.chapter = n;
  state.shoes = null;
  ui.app.classList.remove('in-shoes');
  ui.shoes.hidden = true;
  ui.hud.hidden = false;
  setCast([]);
  ui.box.hidden = true;
  await chapterCard(n, ch);
  await run(ch.you, ch);
  await run(ch.them, ch);
  await run(ch.back, ch);
  ui.box.hidden = true;
  setCast([]);
  const prog = store.get();
  prog.done = [...new Set([...(prog.done ?? []), ch.id])];
  prog.journal = state.journal;
  prog.name = state.name;
  store.set(prog);
  if (n + 1 < CHAPTERS.length) {
    const o = overlay(`
      <div class="title-card">
        <p class="eyebrow">Story complete</p>
        <h1>${ch.title}</h1>
        <p class="sub">Journal card added: ${ch.skill}</p>
        <button class="btn" data-go>Next story</button>
      </div>`, 'dark');
    await waitButton(o);
    await closeOverlay();
    return playChapter(n + 1);
  }
  finale();
}

function finale() {
  ui.hud.hidden = true;
  ui.box.hidden = true;
  setScene('yard', '', '');
  const cards = CHAPTERS.map((ch) => state.journal.find((j) => j.title === ch.title)).filter(Boolean);
  const o = overlay(`
    <div class="finale">
      <p class="eyebrow">Your empathy journal</p>
      <h1>Three stories. Three other sides.</h1>
      <div class="journal">
        ${cards.map((c) => `
          <article class="jcard" style="--c:${PEOPLE[c.other].color}">
            <div class="jface">${face(PEOPLE[c.other], 'happy')}</div>
            <p class="skill">${c.skill}</p>
            <h3>${c.title}</h3>
            <p class="was ${c.open ? 'open' : ''}">${c.open ? 'You stayed open' : 'You thought'}: “${c.thought}”</p>
            <p class="truth">${c.truth}</p>
            <p class="lesson">${c.lesson}</p>
          </article>`).join('')}
      </div>
      <div class="ask">
        <h2>In real life you can’t switch into someone’s shoes. But you can ask.</h2>
        <label for="reflect">Who might need a second look from you this week? Write it for yourself. Nothing here is sent anywhere.</label>
        <textarea id="reflect" rows="2" placeholder="Someone I could ask…"></textarea>
      </div>
      <div class="actions">
        <button class="btn" data-again>Play again</button>
        <button class="btn ghost" data-teach>For teachers</button>
      </div>
      <section class="teach" hidden>
        <h2>Talk about it together</h2>
        ${CHAPTERS.map((ch) => `<div><h3>${ch.title} <span>${ch.skill}</span></h3><ul>${ch.discuss.map((q) => `<li>${q}</li>`).join('')}</ul></div>`).join('')}
      </section>
    </div>`, 'paper scroll');
  o.querySelector('[data-again]').addEventListener('click', () => { sfx.pick(); closeOverlay().then(title); });
  o.querySelector('[data-teach]').addEventListener('click', () => {
    const t = o.querySelector('.teach');
    t.hidden = !t.hidden;
    if (!t.hidden) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });
}

function title() {
  const prog = store.get();
  state.vars = {};
  state.journal = prog.journal ?? [];
  state.shoes = null;
  ui.app.classList.remove('in-shoes');
  ui.hud.hidden = true;
  ui.box.hidden = true;
  setCast([]);
  setScene('home', '', '');
  const done = new Set(prog.done ?? []);
  const o = overlay(`
    <div class="start">
      <div class="faces">${['eric', 'grace', 'kevin'].map((id, i) => `<span style="--i:${i};--c:${PEOPLE[id].color}">${face(PEOPLE[id], ['tired', 'laugh', 'worried'][i])}</span>`).join('')}</div>
      <p class="eyebrow">A short game about the other side of the story</p>
      <h1>In Their Shoes</h1>
      <p class="sub">Three moments at school. You react. Then you live the same moment as the other person.</p>
      <form class="name">
        <label for="name">What should we call you?</label>
        <div class="row"><input id="name" maxlength="16" autocomplete="off" placeholder="Your first name" value="${(prog.name ?? '').replace(/"/g, '')}" required><button class="btn">Start</button></div>
      </form>
      <ol class="chapters">${CHAPTERS.map((ch, i) => `<li class="${done.has(ch.id) ? 'done' : ''}"><button type="button" data-ch="${i}" ${i === 0 || done.has(CHAPTERS[i - 1].id) ? '' : 'disabled'}><b>${i + 1}</b>${ch.title}<small>${ch.skill}</small></button></li>`).join('')}</ol>
      <p class="meta">About 10 minutes · Headphones on for sound</p>
    </div>`, 'paper');
  const input = o.querySelector('#name');
  const begin = (n) => {
    const v = input.value.trim().replace(/[<>&"]/g, '');
    if (!v) { input.focus(); input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 500); return; }
    state.name = v.charAt(0).toUpperCase() + v.slice(1);
    sfx.pick();
    closeOverlay().then(() => playChapter(n));
  };
  o.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); begin(0); });
  o.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => begin(Number(b.dataset.ch))));
  if (!input.value) input.focus({ preventScroll: true });
}

ui.sound.addEventListener('click', () => {
  state.muted = !state.muted;
  ui.sound.setAttribute('aria-pressed', String(state.muted));
  ui.sound.textContent = state.muted ? 'Sound off' : 'Sound on';
});
$('#menu').addEventListener('click', () => {
  onAdvance = null;
  location.reload();
});

title();
document.documentElement.dataset.ready = '1';
