const ICONS = {
  home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  stories: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  journal: '<path d="M7 3h11v18H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h6"/>',
  checkin: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  teachers: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5h5v7h-5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
};
const icon = (k, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

const NAV = [
  ['home', 'Home'],
  ['stories', 'Stories'],
  ['journal', 'My Journal'],
  ['checkin', 'Check-in'],
  ['teachers', 'For Teachers'],
  ['settings', 'Settings'],
];

const MOODS_LIST = [
  { id: 'happy', label: 'Happy', who: 'grace', tip: 'Great! Who could you share some of that energy with today?', title: 'Love that!', msg: 'Happy days are worth noticing. What made today good?', actions: ['write', 'spread', 'story'], story: 'late' },
  { id: 'neutral', label: 'Okay', who: 'eric', tip: 'Okay is fine. Notice one small good thing before the day ends.', title: 'Okay is okay.', msg: 'Not every day needs to be amazing. Want to look for one small good thing?', actions: ['write', 'breathe', 'story'], story: 'quiet' },
  { id: 'tired', label: 'Tired', who: 'eric', tip: 'Your body is asking for rest. Water, a short break, and sleep tonight.', title: 'Thanks for noticing.', msg: 'Being tired makes everything feel harder. Your body is asking for care.', actions: ['breathe', 'rest', 'write'], story: 'late' },
  { id: 'worried', label: 'Worried', who: 'kevin', tip: 'Name the worry. Then tell one person you trust about it.', title: 'Worries feel smaller when shared.', msg: 'You don’t have to carry it alone. Let’s slow down first.', actions: ['breathe', 'talk', 'write', 'story'], story: 'quiet', serious: true },
  { id: 'sad', label: 'Sad', who: 'kevin', tip: 'It’s okay to feel sad. Who is someone you could sit with today?', title: 'I’m sorry you feel sad.', msg: 'Sad is a real feeling, and it’s allowed. Here are some things that can help a little.', actions: ['talk', 'write', 'breathe', 'story'], story: 'quiet', serious: true },
  { id: 'angry', label: 'Angry', who: 'diane', tip: 'Breathe in for 4, out for 6. Decide what to do after the wave passes.', title: 'Anger is a signal.', msg: 'It tells you something matters. Let the wave pass before you decide what to do.', actions: ['breathe', 'write', 'talk', 'story'], story: 'laugh', serious: true },
];

const REASONS = ['Friends', 'School work', 'Family', 'Home', 'Health', 'Not sure'];

const ACTIONS = {
  breathe: { title: 'Breathe with me', sub: '1 minute calm-down', ico: 'checkin' },
  write: { title: 'Write it down', sub: 'Private note in your journal', ico: 'journal' },
  talk: { title: 'Talk to someone', sub: 'Who and how to start', ico: 'teachers' },
  story: { title: 'A story that helps', sub: '1 minute', ico: 'stories' },
  spread: { title: 'Spread it', sub: 'Make someone else’s day', ico: 'home' },
  rest: { title: 'Quick reset', sub: '3 small things for your body', ico: 'clock' },
};

const modal = $('#modal');
let breathTimer = null;

function closeModal() {
  clearTimeout(breathTimer);
  modal.hidden = true;
  modal.innerHTML = '';
  if (current === 'home' || current === 'checkin' || current === 'journal') go(current);
}

function openModal(html) {
  clearTimeout(breathTimer);
  modal.hidden = false;
  modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><button type="button" class="modal-x" aria-label="Close">\u00D7</button>${html}</div>`;
  modal.querySelector('.modal-x').addEventListener('click', closeModal);
  modal.querySelector('.modal-card').focus?.();
}

modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

function support(moodId) {
  const m = MOODS_LIST.find((x) => x.id === moodId);
  const who = PEOPLE.you;
  const entry = prog().checkins.find((c) => c.date === today());
  openModal(`
    <div class="sup-head" style="--c:${PEOPLE[m.who].color}">
      <span class="sup-face">${face(who, m.id)}</span>
      <div><p class="eyebrow">You feel ${m.label.toLowerCase()}</p><h2>${m.title}</h2><p class="sup-msg">${m.msg}</p></div>
    </div>
    <p class="sup-q">What is it about? <small>(optional, only you see this)</small></p>
    <div class="reasons">${REASONS.map((r) => `<button type="button" data-reason="${r}" class="${entry?.reason === r ? 'on' : ''}">${r}</button>`).join('')}</div>
    <div class="acts">${m.actions.map((a) => `<button type="button" class="act" data-act="${a}">${icon(ACTIONS[a].ico)}<span><b>${ACTIONS[a].title}</b><small>${a === 'story' ? `${CHAPTERS.find((c) => c.id === m.story).title} \u00B7 ${ACTIONS[a].sub}` : ACTIONS[a].sub}</small></span></button>`).join('')}</div>
    ${m.serious ? '<p class="care">If this feeling stays for many days, or you feel unsafe, talk to your teacher or the school counsellor. You don\u2019t have to handle it alone.</p>' : ''}
    <button type="button" class="btn sm ghost sup-done">I\u2019m okay for now</button>`);
  modal.querySelectorAll('[data-reason]').forEach((b) => b.addEventListener('click', () => {
    const p = prog();
    const c = p.checkins.find((x) => x.date === today());
    if (c) c.reason = c.reason === b.dataset.reason ? undefined : b.dataset.reason;
    save(p);
    sfx.tick();
    modal.querySelectorAll('[data-reason]').forEach((x) => x.classList.toggle('on', x === b && c?.reason === b.dataset.reason));
  }));
  modal.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { sfx.pick(); runAction(b.dataset.act, m); }));
  modal.querySelector('.sup-done').addEventListener('click', closeModal);
}

function backTo(m) {
  return `<button type="button" class="back" data-back>\u2190 Back</button>`;
}

function bindBack(m) {
  modal.querySelector('[data-back]').addEventListener('click', () => support(m.id));
}

function runAction(a, m) {
  if (a === 'story') {
    modal.hidden = true;
    modal.innerHTML = '';
    return play(CHAPTERS.findIndex((c) => c.id === m.story));
  }
  if (a === 'breathe') return breathe(m);
  if (a === 'write') {
    openModal(`${backTo(m)}<h2>Write it down</h2><p class="sup-msg">Putting a feeling into words makes it easier to handle. This stays private on this device.</p>
      <textarea id="m-note" rows="4" maxlength="300" placeholder="${m.id === 'happy' || m.id === 'neutral' ? 'One good thing today was\u2026' : 'Right now I feel ' + m.label.toLowerCase() + ' because\u2026'}"></textarea>
      <div class="row-btns"><button class="btn sm" id="m-save">Save to my journal</button></div><p class="tip" id="m-msg"></p>`);
    bindBack(m);
    modal.querySelector('#m-note').focus();
    modal.querySelector('#m-save').addEventListener('click', () => {
      const t = modal.querySelector('#m-note').value.trim();
      if (!t) return modal.querySelector('#m-note').focus();
      const p = prog();
      p.notes.push({ at: Date.now(), text: t.slice(0, 300), mood: m.id });
      save(p);
      sfx.card();
      openModal(`<div class="sup-ok"><span class="sup-face">${face(PEOPLE.you, 'happy')}</span><h2>Saved.</h2><p class="sup-msg">You named it and wrote it down. That takes courage.</p><div class="row-btns"><button class="btn sm" data-goto="journal">Open my journal</button><button class="btn sm ghost" data-close>Done</button></div></div>`);
      modal.querySelector('[data-goto]').addEventListener('click', () => { modal.hidden = true; modal.innerHTML = ''; go('journal'); });
      modal.querySelector('[data-close]').addEventListener('click', closeModal);
    });
    return;
  }
  const LISTS = {
    talk: ['Pick one person: a friend, a family member, your class teacher, or the school counsellor.', 'Start simple: \u201CCan I talk to you for a minute? I\u2019m feeling ' + m.label.toLowerCase() + '.\u201D', 'You don\u2019t need the perfect words. Saying it out loud is enough to begin.'],
    spread: ['Tell someone one thing you appreciate about them.', 'Invite someone who is alone to join you.', 'Say thank you to a teacher or a cook today.'],
    rest: ['Drink a glass of water.', 'Stand up, stretch your arms high, and roll your shoulders.', 'Plan to sleep a little earlier tonight.'],
  };
  const t = { talk: 'Talk to someone', spread: 'Spread it', rest: 'Quick reset' }[a];
  openModal(`${backTo(m)}<h2>${t}</h2><ol class="tips">${LISTS[a].map((x) => `<li>${x}</li>`).join('')}</ol><button class="btn sm" data-close>Got it</button>`);
  bindBack(m);
  modal.querySelector('[data-close]').addEventListener('click', closeModal);
}

function breathe(m) {
  openModal(`${backTo(m)}<div class="breath"><h2>Breathe with me</h2><p class="sup-msg">Follow the circle. Three slow breaths.</p>
    <div class="ring"><div class="orb" id="orb"></div><span id="breath-word">Get ready</span></div>
    <p class="breath-count" id="breath-count">Breath 1 of 3</p><button class="btn sm ghost" data-close>Stop</button></div>`);
  bindBack(m);
  modal.querySelector('[data-close]').addEventListener('click', closeModal);
  const orb = modal.querySelector('#orb');
  const word = modal.querySelector('#breath-word');
  const count = modal.querySelector('#breath-count');
  const steps = [['Breathe in', 4000, 'in'], ['Hold', 2000, 'hold'], ['Breathe out', 6000, 'out']];
  let round = 0;
  let i = 0;
  const tick = () => {
    if (modal.hidden || !modal.contains(orb)) return;
    if (i === steps.length) { i = 0; round += 1; }
    if (round === 3) {
      sfx.card();
      word.textContent = 'Well done';
      orb.className = 'orb';
      count.textContent = 'How do you feel now?';
      const btn = modal.querySelector('[data-close]');
      btn.textContent = 'Done';
      btn.classList.remove('ghost');
      return;
    }
    const [label, ms, cls] = steps[i];
    word.textContent = label;
    orb.style.transitionDuration = `${ms}ms`;
    orb.className = `orb ${cls}`;
    count.textContent = `Breath ${round + 1} of 3`;
    if (cls !== 'hold') tone(cls === 'in' ? 392 : 330, 0.5, 'sine', 0.025);
    i += 1;
    breathTimer = setTimeout(tick, reduced ? 300 : ms);
  };
  breathTimer = setTimeout(tick, reduced ? 100 : 900);
}

const shell = $('#shell');
const view = $('#view');
const app = $('#app');
let current = 'home';

const prog = () => {
  const p = store.get();
  p.done ??= [];
  p.journal ??= [];
  p.checkins ??= [];
  p.notes ??= [];
  p.settings = { sound: true, speed: 'fast', ...(p.settings ?? {}) };
  return p;
};
const save = (p) => store.set(p);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const today = () => new Date().toISOString().slice(0, 10);
const dayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
const longDate = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

function renderNav() {
  const p = prog();
  $('#nav').innerHTML = NAV.map(([k, label]) => `<button type="button" class="nav-item ${current === k ? 'on' : ''}" data-view="${k}">${icon(k)}<span>${label}</span></button>`).join('');
  const a = accounts.current();
  $('#me').innerHTML = `<span class="avatar">${face(PEOPLE.you, 'happy')}</span><span class="me-text"><b>${esc(a?.name ?? p.name ?? '')}</b><small>${esc(a?.cls || 'Student')}</small></span><button type="button" class="logout" id="logout" title="Log out">Log out</button>`;
  $('#logout').addEventListener('click', logout);
  $('#nav').querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => go(b.dataset.view)));
}

function go(k) {
  current = k;
  renderNav();
  view.innerHTML = VIEWS[k]();
  view.scrollTop = 0;
  scrollTo(0, 0);
  view.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => play(Number(b.dataset.play))));
  view.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  BIND[k]?.();
  view.focus({ preventScroll: true });
}

function play(n) {
  clearTimeout(breathTimer);
  modal.hidden = true;
  modal.innerHTML = '';
  const p = prog();
  sfx.pick();
  shell.hidden = true;
  app.hidden = false;
  startStory(n, accounts.current()?.name ?? p.name, p.settings);
}

onExit = (k) => {
  app.hidden = true;
  shell.hidden = false;
  go(k);
};

function storyCard(ch, i, done) {
  const p = PEOPLE[ch.other];
  const scenes = { late: 'classroom', laugh: 'classroom', quiet: 'yard' };
  return `
    <article class="story" style="--c:${p.color}">
      <div class="story-art">${scene(scenes[ch.id], ch.id === 'late' ? 'Clean water' : ch.id === 'laugh' ? 'My hero' : '')}<span class="story-face">${face(p, done ? 'happy' : ch.id === 'late' ? 'tired' : ch.id === 'laugh' ? 'laugh' : 'worried')}</span></div>
      <div class="story-body">
        <div class="chips"><span class="chip skill">${ch.skill}</span><span class="chip">${icon('clock')}1 min</span>${done ? `<span class="chip ok">${icon('check')}Done</span>` : '<span class="chip new">New</span>'}</div>
        <h3>${i + 1}. ${ch.title}</h3>
        <p>${STORY_BLURB[ch.id]}</p>
        <button class="btn sm" data-play="${i}">${icon('play')}${done ? 'Play again' : 'Play story'}</button>
      </div>
    </article>`;
}

const STORY_BLURB = {
  late: 'Eric runs in late with no poster on presentation day. Then you live his morning.',
  laugh: 'Grace laughs while you present. Then you feel what she was feeling.',
  quiet: 'The new boy Kevin ignores your hello. Then you spend a night as Kevin.',
};

function weekStrip(checkins) {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  return `<div class="week">${days.map((d) => {
    const c = [...checkins].reverse().find((x) => x.date === d);
    const m = c && MOODS_LIST.find((x) => x.id === c.mood);
    return `<div class="day ${d === today() ? 'today' : ''}"><span class="dface">${m ? face(PEOPLE[m.who], m.id) : ''}</span><small>${dayLabel(d)}</small></div>`;
  }).join('')}</div>`;
}

function moodPicker(selected) {
  return `<div class="moods">${MOODS_LIST.map((m) => `<button type="button" class="mood ${selected === m.id ? 'on' : ''}" data-mood="${m.id}" style="--c:${PEOPLE[m.who].color}"><span>${face(PEOPLE[m.who], m.id)}</span>${m.label}</button>`).join('')}</div>`;
}

function bindMood(after) {
  view.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => {
    const p = prog();
    p.checkins = p.checkins.filter((c) => c.date !== today()).concat({ date: today(), mood: b.dataset.mood });
    save(p);
    sfx.pick();
    after(b.dataset.mood);
    support(b.dataset.mood);
  }));
}

const VIEWS = {
  home() {
    const p = prog();
    const done = new Set(p.done);
    const next = CHAPTERS.findIndex((c) => !done.has(c.id));
    const nc = CHAPTERS[next >= 0 ? next : 0];
    const np = PEOPLE[nc.other];
    const todayMood = p.checkins.find((c) => c.date === today())?.mood;
    const weekCount = p.checkins.filter((c) => (Date.now() - new Date(`${c.date}T12:00:00`)) / 864e5 < 7).length;
    const latest = p.journal.at(-1);
    return `
      <header class="page-head home-head">
        <span class="home-me">${face(PEOPLE.you, todayMood ?? 'happy')}</span>
        <div class="home-hi"><p class="eyebrow">${longDate()}</p><h1>${greeting()}, ${esc(accounts.current()?.name ?? p.name)}.</h1></div>
        <button type="button" class="pill-btn" data-go="settings">${icon('settings')}<span>${esc(accounts.current()?.cls || 'My profile')}</span></button>
      </header>
      <section class="hero" style="--c:${np.color}">
        <div class="hero-text">
          <p class="eyebrow">${next >= 0 ? (done.size ? 'Up next' : 'Start here') : 'All stories complete'}</p>
          <h2>${next >= 0 ? nc.title : 'You’ve seen all three sides.'}</h2>
          <p>${next >= 0 ? STORY_BLURB[nc.id] : 'Play any story again, or open your journal to see what you learned.'}</p>
          <div class="row">
            <button class="btn light" ${next >= 0 ? `data-play="${next}"` : 'data-go="journal"'}>${icon(next >= 0 ? 'play' : 'journal')}${next >= 0 ? 'Play · 1 min' : 'Open my journal'}</button>
            ${next >= 0 ? `<span class="skill-tag">${nc.skill}</span>` : ''}
          </div>
        </div>
        <figure class="hero-char"><div class="hero-face">${face(np, next >= 0 ? 'worried' : 'happy')}</div><figcaption>${next >= 0 ? `Meet ${np.name}` : 'All done'}</figcaption></figure>
      </section>
      <section class="stats">
        <div class="stat"><b>${done.size}<small>/${CHAPTERS.length}</small></b><span>Stories completed</span><i style="--w:${(done.size / CHAPTERS.length) * 100}%"></i></div>
        <div class="stat"><b>${p.journal.length}</b><span>Journal cards</span></div>
        <div class="stat"><b>${weekCount}</b><span>Check-ins this week</span></div>
      </section>
      <div class="grid2">
        <section class="panel">
          <div class="panel-head"><h3>How are you feeling today?</h3><button class="link" data-go="checkin">History</button></div>
          ${moodPicker(todayMood)}
          <p class="tip" id="home-tip">${todayMood ? MOODS_LIST.find((m) => m.id === todayMood).tip : 'Tap a face. Only you can see this.'}</p>
        </section>
        <section class="panel">
          <div class="panel-head"><h3>Skills you’re practising</h3></div>
          <ul class="skills">${CHAPTERS.map((c) => `<li class="${done.has(c.id) ? 'got' : ''}" style="--c:${PEOPLE[c.other].color}"><span class="tick">${done.has(c.id) ? icon('check') : ''}</span><b>${c.skill}</b><small>${c.title}</small></li>`).join('')}</ul>
        </section>
      </div>
      ${latest ? `<section class="panel quote" style="--c:${PEOPLE[latest.other].color}"><p class="eyebrow">Latest from your journal</p><h3>${latest.lesson}</h3><button class="link" data-go="journal">See all cards</button></section>` : ''}`;
  },
  stories() {
    const done = new Set(prog().done);
    return `
      <header class="page-head"><div><p class="eyebrow">Library</p><h1>Stories</h1><p class="lead">Each story is one moment at school, told from two sides. About one minute each.</p></div></header>
      <div class="stories">${CHAPTERS.map((c, i) => storyCard(c, i, done.has(c.id))).join('')}</div>
      <section class="panel how"><h3>How every story works</h3><ol>
        <li><b>You react.</b> Something happens. Choose what you do.</li>
        <li><b>You judge.</b> Say honestly what you think of them.</li>
        <li><b>You switch.</b> Live the same moment as the other person.</li>
        <li><b>You choose again.</b> Same moment, now that you know.</li>
      </ol></section>`;
  },
  journal() {
    const p = prog();
    const cards = CHAPTERS.map((ch) => p.journal.find((j) => j.title === ch.title)).filter(Boolean);
    return `
      <header class="page-head"><div><p class="eyebrow">Private</p><h1>My Journal</h1><p class="lead">What you thought, what was true, and what you learned. Saved only on this device.</p></div></header>
      ${cards.length ? `<div class="journal">${cards.map((c) => `
        <article class="jcard" style="--c:${PEOPLE[c.other].color}">
          <div class="jface">${face(PEOPLE[c.other], 'happy')}</div>
          <p class="skill">${c.skill}</p>
          <h3>${c.title}</h3>
          <p class="was ${c.open ? 'open' : ''}">${c.open ? 'You stayed open' : 'You thought'}: “${esc(c.thought)}”</p>
          <p class="truth">${c.truth}</p>
          <p class="lesson">${c.lesson}</p>
        </article>`).join('')}</div>` : `<section class="panel empty"><h3>No cards yet</h3><p>Finish a story and its card appears here.</p><button class="btn sm" data-play="0">${icon('play')}Play the first story</button></section>`}
      <section class="panel notes">
        <h3>In real life you can’t switch shoes. But you can ask.</h3>
        <label for="note">Who might need a second look from you this week?</label>
        <div class="note-row"><textarea id="note" rows="2" maxlength="300" placeholder="Someone I could ask…"></textarea><button class="btn sm" id="save-note">Save note</button></div>
        <ul class="note-list">${p.notes.slice().reverse().map((n) => `<li><small>${new Date(n.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${n.mood ? ` \u00B7 felt ${MOODS_LIST.find((m) => m.id === n.mood)?.label.toLowerCase() ?? ''}` : ''}</small>${esc(n.text)}</li>`).join('')}</ul>
      </section>`;
  },
  checkin() {
    const p = prog();
    const todayMood = p.checkins.find((c) => c.date === today())?.mood;
    const counts = MOODS_LIST.map((m) => ({ ...m, n: p.checkins.filter((c) => c.mood === m.id).length })).filter((m) => m.n);
    return `
      <header class="page-head"><div><p class="eyebrow">Daily</p><h1>Check-in</h1><p class="lead">Naming a feeling is the first step to handling it. Nobody scores this, and it never leaves this device.</p></div></header>
      <section class="panel big-check">
        <h3>How are you feeling right now?</h3>
        ${moodPicker(todayMood)}
        <p class="tip" id="check-tip">${todayMood ? MOODS_LIST.find((m) => m.id === todayMood).tip : 'Pick the face closest to how you feel.'}</p>
      </section>
      <section class="panel"><div class="panel-head"><h3>Your week</h3></div>${weekStrip(p.checkins)}</section>
      ${counts.length ? `<section class="panel"><div class="panel-head"><h3>Feelings you’ve named</h3></div><div class="tally">${counts.map((m) => `<span class="chip" style="--c:${PEOPLE[m.who].color}">${m.label} · ${m.n}</span>`).join('')}</div><p class="tip">Every feeling is allowed. What matters is what you do next.</p></section>` : ''}`;
  },
  teachers() {
    return `
      <header class="page-head"><div><p class="eyebrow">Classroom guide</p><h1>For Teachers</h1><p class="lead">Run a 15-minute empathy lesson with one projector and one story.</p></div><button class="btn sm ghost" id="print">Print guide</button></header>
      <section class="panel"><h3>15-minute lesson plan</h3><ol class="steps">
        <li><span>2 min</span><div><b>Set up.</b> Project the story. Explain: we will see one moment from two sides.</div></li>
        <li><span>3 min</span><div><b>Class votes.</b> At every choice, students vote by raising hands. Pick the most popular answer.</div></li>
        <li><span>2 min</span><div><b>The judgement.</b> Ask: what do we honestly think of them? Pick the class answer.</div></li>
        <li><span>3 min</span><div><b>The switch.</b> Play their side. Pause on the truth card and let it land.</div></li>
        <li><span>5 min</span><div><b>Talk.</b> Use the questions below in pairs, then share.</div></li>
      </ol></section>
      <div class="guides">${CHAPTERS.map((c) => `
        <section class="panel guide" style="--c:${PEOPLE[c.other].color}">
          <p class="eyebrow">${c.skill}</p><h3>${c.title}</h3>
          <ul>${c.discuss.map((q) => `<li>${q}</li>`).join('')}</ul>
          <button class="btn sm" data-play="${CHAPTERS.indexOf(c)}">${icon('play')}Project this story</button>
        </section>`).join('')}</div>
      <section class="panel"><h3>Ground rules</h3><ul class="rules">
        <li>No scores. The game never rates a student’s feelings or empathy.</li>
        <li>Judgements are private unless a student chooses to share.</li>
        <li>Every character and story is fictional.</li>
      </ul></section>`;
  },
  settings() {
    const p = prog();
    const s = p.settings;
    const acc = accounts.current();
    return `
      <header class="page-head"><div><p class="eyebrow">Preferences</p><h1>Settings</h1></div></header>
      <section class="panel form">
        <div class="acct"><span class="who-face lg">${face(PEOPLE.you, 'happy')}</span><div><h3>${esc(acc.name)}</h3><p class="tip">${esc(acc.cls || 'No class set')} · Account on this device</p></div><button class="btn sm ghost" id="set-logout">Log out</button></div>
        <div class="su-row">
          <div><label for="set-name">First name</label><input id="set-name" maxlength="16" value="${esc(acc.name)}"></div>
          <div><label for="set-class">Class</label><input id="set-class" maxlength="12" value="${esc(acc.cls || '')}" placeholder="e.g. S2 A"></div>
        </div>
        <button class="btn sm" id="save-name">Save profile</button>
        <p class="tip" id="name-msg"></p>
      </section>
      <section class="panel form">
        <label for="set-pin">Change PIN</label>
        <div class="note-row"><input id="set-pin" type="password" inputmode="numeric" maxlength="4" placeholder="New 4-digit PIN"><button class="btn sm" id="save-pin">Update PIN</button></div>
        <p class="tip" id="pin-msg2"></p>
      </section>
      <section class="panel form">
        <label>Sound</label>
        <div class="seg" id="set-sound">${[['on', 'On'], ['off', 'Off']].map(([v, l]) => `<button type="button" data-v="${v}" class="${(s.sound ? 'on' : 'off') === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <label>Text speed</label>
        <div class="seg" id="set-speed">${[['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']].map(([v, l]) => `<button type="button" data-v="${v}" class="${s.speed === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="tip">Presenting? Use Fast or Instant.</p>
      </section>
      <section class="panel form danger">
        <label>Start over</label>
        <p class="tip">Reset clears your stories, journal, check-ins and notes. Delete removes your whole account from this device.</p>
        <div class="row-btns"><button class="btn sm ghost" id="reset">Reset my progress</button><button class="btn sm ghost danger-btn" id="delete-acc">Delete my account</button></div>
      </section>
      <p class="about">In Their Shoes · A social and emotional learning platform · Works offline · Nothing is sent anywhere</p>`;
  },
};

const BIND = {
  home() {
    bindMood((m) => go('home'));
  },
  checkin() {
    bindMood(() => go('checkin'));
  },
  journal() {
    $('#save-note').addEventListener('click', () => {
      const t = $('#note').value.trim();
      if (!t) return $('#note').focus();
      const p = prog();
      p.notes.push({ at: Date.now(), text: t.slice(0, 300) });
      save(p);
      sfx.pick();
      go('journal');
    });
  },
  teachers() {
    $('#print').addEventListener('click', () => print());
  },
  settings() {
    const acc = accounts.current();
    $('#set-logout').addEventListener('click', logout);
    $('#save-name').addEventListener('click', () => {
      const v = cleanName($('#set-name').value);
      if (!v) return $('#set-name').focus();
      const cls = $('#set-class').value.trim().replace(/[<>&"]/g, '').slice(0, 12);
      accounts.update(acc.id, { name: v, cls });
      const p = prog();
      p.name = v;
      save(p);
      sfx.pick();
      go('settings');
      $('#name-msg').textContent = 'Saved.';
    });
    $('#save-pin').addEventListener('click', async () => {
      const v = $('#set-pin').value.trim();
      const m = $('#pin-msg2');
      if (!/^\d{4}$/.test(v)) { m.textContent = 'Your PIN must be exactly 4 numbers.'; return; }
      if (/^(\d)\1{3}$/.test(v) || v === '1234') { m.textContent = 'That PIN is too easy to guess.'; return; }
      accounts.update(acc.id, { pin: await hashPin(acc.id, v) });
      $('#set-pin').value = '';
      sfx.card();
      m.textContent = 'PIN updated.';
    });
    $('#delete-acc').addEventListener('click', () => {
      if (!confirm(`Delete ${acc.name}'s account and everything in it from this device?`)) return;
      accounts.save(accounts.all().filter((a) => a.id !== acc.id));
      try { localStorage.removeItem(store.key()); } catch {}
      logout();
    });
    for (const [id, key] of [['#set-sound', 'sound'], ['#set-speed', 'speed']]) {
      $(id).querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const p = prog();
        p.settings[key] = key === 'sound' ? b.dataset.v === 'on' : b.dataset.v;
        save(p);
        state.muted = !p.settings.sound;
        sfx.pick();
        go('settings');
      }));
    }
    $('#reset').addEventListener('click', () => {
      if (!confirm('Reset all progress on this device?')) return;
      const p = prog();
      save({ name: p.name, settings: p.settings });
      go('home');
    });
  },
};

function cleanName(v) {
  const t = v.trim().replace(/[<>&"]/g, '').slice(0, 16);
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

function enterApp() {
  const p = prog();
  state.muted = !p.settings.sound;
  app.hidden = true;
  shell.hidden = false;
  go('home');
}

const resumed = accounts.current();
if (resumed) { applyAccount(resumed); authRoot.hidden = true; enterApp(); } else showAuth();
document.documentElement.dataset.ready = '1';
