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

await shot('title');
await page.fill('#name', 'Aline');
await page.click$('form .btn');

const probe = `(() => {
  const o = document.querySelector('#overlay');
  const opts = [...o.querySelectorAll('.option:not(:disabled)')];
  const go = o.querySelector('[data-go]');
  const fin = o.querySelector('[data-again]');
  const ch = [...document.querySelectorAll('.choice:not(:disabled)')];
  const box = document.querySelector('#box');
  const hint = document.querySelector('#hint').classList.contains('show');
  return {
    kind: fin ? 'finale' : opts.length ? 'judge' : go ? (o.className.includes('switching') ? 'switch' : o.className.includes('returning') ? 'return' : o.querySelector('.reveal') ? 'reveal' : 'card') : ch.length ? 'choice' : !box.hidden ? (hint ? 'line' : 'typing') : 'idle',
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
  if (['judge', 'switch', 'return', 'reveal', 'card', 'choice', 'finale'].includes(s.kind) || (s.kind === 'line' && !seen.has(sig))) {
    if (!seen.has(sig) || s.kind === 'finale') {
      seen.add(sig);
      await new Promise((r) => setTimeout(r, s.kind === 'line' ? 200 : 900));
      await shot(`${s.chapter.split(' · ')[0] || 'x'}-${s.kind}`.replace(/\W+/g, '-'));
    }
  }
  if (s.kind === 'finale') break;
  if (s.kind === 'judge') await page.evaluate(`document.querySelectorAll('#overlay .option')[${pick} % ${s.n}].click()`);
  else if (['switch', 'return', 'reveal', 'card'].includes(s.kind)) await page.evaluate(`document.querySelector('#overlay [data-go]').click()`);
  else if (s.kind === 'choice') { log.push(`choice: ${s.tag}`); await page.evaluate(`document.querySelectorAll('.choice')[${pick} % ${s.n}].click()`); }
  else if (s.kind === 'line' || s.kind === 'typing') { if (s.kind === 'line') log.push(`${s.tag || '-'}: ${s.text}`); await key(); }
  else if (++idle > 60) throw new Error(`stuck idle at ${sig}`);
  await new Promise((r) => setTimeout(r, s.kind === 'typing' ? 60 : 450));
}

await page.evaluate(`document.querySelector('[data-teach]').click(), true`);
await new Promise((r) => setTimeout(r, 900));
await shot('teachers');
const journal = await page.evaluate(`document.querySelectorAll('.jcard').length`);
const stored = await page.evaluate(`localStorage.getItem('its:progress')`);
console.log(`lines/choices: ${log.length}, journal cards: ${journal}, shots: ${n}`);
console.log(`stored: ${stored ? JSON.parse(stored).done.join(',') : 'none'}`);
console.log(`errors: ${page.errors.length ? page.errors.join('\n') : 'none'}`);
await page.close();
if (page.errors.length || journal !== 3) process.exit(1);
