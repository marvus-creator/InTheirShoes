import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];

const HELPERS = `
window.__fill = (sel, value) => {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if (!el) throw new Error('missing ' + sel);
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};
window.__clickText = (text, tag = 'button,a,label,[role=tab]') => {
  const els = [...document.querySelectorAll(tag)].filter((e) => e.textContent.replace(/\\s+/g, ' ').trim().includes(text) && !e.disabled);
  if (!els.length) throw new Error('no clickable with text: ' + text);
  els[0].click();
  return true;
};
`;

export async function launch({ port = 9444, width = 1440, height = 900 } = {}) {
  const chrome = process.env.CHROME_PATH ?? CHROME.find((c) => existsSync(c));
  if (!chrome) throw new Error('Chrome not found');
  const profile = path.join(process.env.TEMP ?? '/tmp', `its-verify-${Math.random().toString(36).slice(2)}`);
  const child = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  const deadline = Date.now() + 20000;
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) break;
    } catch {}
    if (Date.now() > deadline) throw new Error('Chrome did not start');
    await new Promise((r) => setTimeout(r, 200));
  }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  const errors = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const on = (method, fn) => listeners.set(method, [...(listeners.get(method) ?? []), fn]);
  on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: HELPERS });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const page = {
    errors,
    send,
    evaluate,
    async goto(url) {
      const loaded = new Promise((res) => on('Page.loadEventFired', res));
      await send('Page.navigate', { url });
      await Promise.race([loaded, new Promise((r) => setTimeout(r, 60000))]);
      await page.waitFor('document.readyState === "complete" && document.documentElement.dataset.ready === "1"', 60000);
      await new Promise((r) => setTimeout(r, 300));
    },
    async waitFor(expr, timeout = 30000) {
      const end = Date.now() + timeout;
      for (;;) {
        try {
          if (await evaluate(`Boolean(${expr})`)) return true;
        } catch {}
        if (Date.now() > end) throw new Error(`timed out waiting for: ${expr}`);
        await new Promise((r) => setTimeout(r, 250));
      }
    },
    async text(t, timeout) {
      return page.waitFor(`document.body.innerText.includes(${JSON.stringify(t)})`, timeout);
    },
    async fill(sel, value) {
      await page.waitFor(`document.querySelector(${JSON.stringify(sel)})`);
      return evaluate(`window.__fill(${JSON.stringify(sel)}, ${JSON.stringify(value)})`);
    },
    async click(text, tag) {
      await page.waitFor(`[...document.querySelectorAll(${JSON.stringify(tag ?? 'button,a,label,[role=tab]')})].some((e) => e.textContent.replace(/\\s+/g,' ').includes(${JSON.stringify(text)}) && !e.disabled)`);
      return evaluate(`window.__clickText(${JSON.stringify(text)}${tag ? `, ${JSON.stringify(tag)}` : ''})`);
    },
    async click$(sel) {
      await page.waitFor(`document.querySelector(${JSON.stringify(sel)})`);
      return evaluate(`document.querySelector(${JSON.stringify(sel)}).click(), true`);
    },
    async url() {
      return evaluate('location.href');
    },
    async setSession(base, token) {
      const u = new URL(base);
      await send('Network.clearBrowserCookies');
      if (token) await send('Network.setCookie', { name: 'impact_session', value: token, domain: u.hostname, path: '/', httpOnly: true });
    },
    async close() {
      ws.close();
      child.kill();
    },
  };
  return page;
}
