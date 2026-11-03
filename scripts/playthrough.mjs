import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';

const root = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const width = Number(arg('width', 1600));
const height = Number(arg('height', 900));
const pick = Number(arg('pick', 0));
const out = path.join(root, 'shots', arg('name', 'desktop'));
mkdirSync(out, { recursive: true });

const page = await launch({ width, height, port: 9450 + pick });
if (width < 700) await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
await new Promise((r) => setTimeout(r, 1200));

let n = 0;
const seen = new Set();
async function shot(label) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  const file = path.join(out, `${String(++n).padStart(2, '0')}-${label}.png`);
  writeFileSync(file, Buffer.from(data, 'base64'));
}

await shot('signup');
await page.fill('#su-name', 'aline');
await page.fill('#su-class', 'S2 A');
await page.click$('[data-hair="braids"]');
await page.fill('#su-pin', '1111');
await page.fill('#su-pin2', '1111');
await page.click$('#su .btn');
const weak = await page.evaluate(`document.querySelector('#su-err').textContent`);
if (!weak.includes('too easy')) throw new Error('weak PIN accepted');
await page.fill('#su-pin', '2580');
await page.fill('#su-pin2', '2580');
await page.click$('#su .btn');
await page.waitFor(`!document.querySelector('#shell').hidden && document.querySelector('.hero')`);
await new Promise((r) => setTimeout(r, 700));
await shot('dashboard-empty');
await page.click$('.mood[data-mood="happy"]');
await new Promise((r) => setTimeout(r, 500));
await page.click$('[data-play="0"]');
await page.waitFor(`!document.querySelector('#app').hidden`);

const probe = `(() => {
  const o = document.querySelector('#overlay');
  const opts = [...o.querySelectorAll('.option:not(:disabled)')];
  const go = o.querySelector('[data-go]');
  const fin = o.querySelector('[data-again]');
  const ch = [...document.querySelectorAll('.choice:not(:disabled)')];
  const box = document.querySelector('#box');
  const hint = document.querySelector('#hint').classList.contains('show');
  return {
    kind: o.querySelector('[data-next]') ? 'next' : o.querySelector('[data-journal]') ? 'complete' : fin ? 'finale' : opts.length ? 'judge' : go ? (o.className.includes('switching') ? 'switch' : o.className.includes('returning') ? 'return' : o.querySelector('.reveal') ? 'reveal' : 'card') : ch.length ? 'choice' : !box.hidden ? (hint ? 'line' : 'typing') : 'idle',
    n: opts.length || ch.length,
    chapter: document.querySelector('#chapter-label').textContent,
    time: document.querySelector('#time').textContent,
    text: document.querySelector('#text').textContent.slice(0, 50),
    tag: document.querySelector('#tag').hidden ? '' : document.querySelector('#tag').textContent,
  };
})()`;

const key = () => page.evaluate(`document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })), true`);
const log = [];
let steps = 0;
let idle = 0;
for (;;) {
  if (++steps > 900) throw new Error('playthrough did not finish');
  const s = await page.evaluate(probe);
  const sig = `${s.chapter}|${s.kind}|${s.time}`;
  if (['judge', 'switch', 'return', 'reveal', 'card', 'choice', 'next', 'complete'].includes(s.kind) || (s.kind === 'line' && !seen.has(sig))) {
    if (!seen.has(sig)) {
      seen.add(sig);
      await new Promise((r) => setTimeout(r, s.kind === 'line' ? 200 : 900));
      await shot(`${s.chapter.split(' · ')[0] || 'x'}-${s.kind}`.replace(/\W+/g, '-'));
    }
  }
  if (s.kind === 'complete') { await page.evaluate(`document.querySelector('[data-journal]').click()`); break; }
  if (s.kind === 'next') { await page.evaluate(`document.querySelector('[data-next]').click()`); await new Promise((r) => setTimeout(r, 600)); continue; }
  if (s.kind === 'judge') await page.evaluate(`document.querySelectorAll('#overlay .option')[${pick} % ${s.n}].click()`);
  else if (['switch', 'return', 'reveal', 'card'].includes(s.kind)) await page.evaluate(`document.querySelector('#overlay [data-go]').click()`);
  else if (s.kind === 'choice') { log.push(`choice: ${s.tag}`); await page.evaluate(`document.querySelectorAll('.choice')[${pick} % ${s.n}].click()`); }
  else if (s.kind === 'line' || s.kind === 'typing') { if (s.kind === 'line') log.push(`${s.tag || '-'}: ${s.text}`); await key(); }
  else if (++idle > 60) throw new Error(`stuck idle at ${sig}`);
  await new Promise((r) => setTimeout(r, s.kind === 'typing' ? 60 : 450));
}

await page.waitFor(`!document.querySelector('#shell').hidden && document.querySelector('.jcard')`);
await new Promise((r) => setTimeout(r, 700));
await shot('journal');
const journal = await page.evaluate(`document.querySelectorAll('.jcard').length`);
await page.fill('#note', 'Ask Kevin to sit with us');
await page.click$('#save-note');
for (const v of ['home', 'stories', 'checkin', 'teachers', 'settings']) {
  await page.evaluate(`document.querySelector('[data-view="${v}"]').click(), true`);
  await new Promise((r) => setTimeout(r, 700));
  await shot(v);
}
const pinPad = async (digits) => { for (const d of digits) await page.evaluate(`document.querySelector('[data-d="${d}"]').click(), true`); await new Promise((r) => setTimeout(r, 900)); };
await page.evaluate(`document.querySelector('[data-view="home"]').click(), true`);
await page.click$('#logout');
await page.waitFor(`!document.querySelector('#auth').hidden && document.querySelector('.who-tile')`);
await page.click$('#add-acc');
await page.fill('#su-name', 'Patrick');
await page.fill('#su-pin', '4826');
await page.fill('#su-pin2', '4826');
await page.click$('#su .btn');
await page.waitFor(`document.querySelector('.hero')`);
const fresh = await page.evaluate(`document.querySelector('.stat b').textContent`);
if (!fresh.startsWith('0')) throw new Error('second student saw first student progress: ' + fresh);
await page.click$('#logout');
await page.waitFor(`document.querySelectorAll('.who-tile').length === 3`);
await new Promise((r) => setTimeout(r, 600));
await shot('who');
await page.click$('[data-acc]');
await pinPad('1234');
const wrong = await page.evaluate(`document.querySelector('#pin-msg').textContent`);
if (!wrong.includes('Wrong')) throw new Error('wrong PIN not rejected');
await shot('pin-wrong');
await pinPad('2580');
await page.waitFor(`!document.querySelector('#shell').hidden && document.querySelector('.hero')`);
const back = await page.evaluate(`document.querySelector('.stat b').textContent + ' ' + document.querySelector('.me b').textContent`);
if (!back.startsWith('3') || !back.includes('Aline')) throw new Error('progress not restored after login: ' + back);
console.log('auth: weak PIN blocked, wrong PIN blocked, separate progress, restored ' + back);
const notes = await page.evaluate(`JSON.parse(localStorage.getItem('its:progress:' + localStorage.getItem('its:session'))).notes.length`);
const checkins = await page.evaluate(`JSON.parse(localStorage.getItem('its:progress:' + localStorage.getItem('its:session'))).checkins.length`);
console.log(`notes: ${notes}, checkins: ${checkins}`);
const stored = await page.evaluate(`localStorage.getItem('its:progress:' + localStorage.getItem('its:session'))`);
console.log(`lines/choices: ${log.length}, journal cards: ${journal}, shots: ${n}`);
console.log(`stored: ${stored ? JSON.parse(stored).done.join(',') : 'none'}`);
console.log(`errors: ${page.errors.length ? page.errors.join('\n') : 'none'}`);
await page.close();
if (page.errors.length || journal !== 3) process.exit(1);
