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
  { id: 'happy', label: 'Happy', who: 'grace', tip: 'Great! Who could you share some of that energy with today?' },
  { id: 'neutral', label: 'Okay', who: 'eric', tip: 'Okay is fine. Notice one small good thing before the day ends.' },
  { id: 'tired', label: 'Tired', who: 'eric', tip: 'Your body is asking for rest. Water, a short break, and sleep tonight.' },
  { id: 'worried', label: 'Worried', who: 'kevin', tip: 'Name the worry. Then tell one person you trust about it.' },
  { id: 'sad', label: 'Sad', who: 'kevin', tip: 'It’s okay to feel sad. Who is someone you could sit with today?' },
  { id: 'angry', label: 'Angry', who: 'diane', tip: 'Breathe in for 4, out for 6. Decide what to do after the wave passes.' },
];

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
  $('#me').innerHTML = `<span class="avatar">${face(PEOPLE.you, 'happy')}</span><span><b>${esc(p.name ?? '')}</b><small>Student</small></span>`;
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
  const p = prog();
  sfx.pick();
  shell.hidden = true;
  app.hidden = false;
  startStory(n, p.name, p.settings);
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
      <header class="page-head">
        <div><p class="eyebrow">${longDate()}</p><h1>${greeting()}, ${esc(p.name)}.</h1></div>
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
        <div class="hero-face">${face(np, next >= 0 ? 'worried' : 'happy')}</div>
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
        <ul class="note-list">${p.notes.slice().reverse().map((n) => `<li><small>${new Date(n.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</small>${esc(n.text)}</li>`).join('')}</ul>
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
    return `
      <header class="page-head"><div><p class="eyebrow">Preferences</p><h1>Settings</h1></div></header>
      <section class="panel form">
        <label for="set-name">Your name</label>
        <div class="note-row"><input id="set-name" maxlength="16" value="${esc(p.name)}"><button class="btn sm" id="save-name">Save</button></div>
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
        <p class="tip">Clears stories, journal cards, check-ins and notes on this device.</p>
        <button class="btn sm ghost" id="reset">Reset all progress</button>
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
    $('#save-name').addEventListener('click', () => {
      const v = cleanName($('#set-name').value);
      if (!v) return $('#set-name').focus();
      const p = prog();
      p.name = v;
      save(p);
      sfx.pick();
      go('settings');
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

function onboard() {
  shell.hidden = true;
  app.hidden = false;
  ui.hud.hidden = true;
  setScene('home', '', '');
  const o = overlay(`
    <div class="start">
      <div class="faces">${['eric', 'grace', 'kevin'].map((id, i) => `<span style="--i:${i};--c:${PEOPLE[id].color}">${face(PEOPLE[id], ['tired', 'laugh', 'worried'][i])}</span>`).join('')}</div>
      <p class="eyebrow">A social and emotional learning platform</p>
      <h1>In Their Shoes</h1>
      <p class="sub">Short stories where you see a moment at school from the other person’s side. Plus a daily check-in and a private journal.</p>
      <form class="name">
        <label for="name">What should we call you?</label>
        <div class="row"><input id="name" maxlength="16" autocomplete="off" placeholder="Your first name" required><button class="btn">Get started</button></div>
      </form>
      <p class="meta">Works offline · Nothing leaves this device</p>
    </div>`, 'paper');
  const input = o.querySelector('#name');
  input.focus({ preventScroll: true });
  o.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = cleanName(input.value);
    if (!v) { input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 500); return; }
    const p = prog();
    p.name = v;
    save(p);
    sfx.pick();
    closeOverlay().then(() => { app.hidden = true; shell.hidden = false; go('home'); });
  });
}

const boot = prog();
state.muted = !boot.settings.sound;
if (boot.name) { app.hidden = true; go('home'); } else onboard();
document.documentElement.dataset.ready = '1';
