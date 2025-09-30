// messages.js
const M_PATH = './data/messages.json';
const LS_KEY = 'scs6027_messages';

export async function load() {
  try {
    const res = await fetch(M_PATH, {cache:"no-store"});
    if (res.ok) {
      const js = await res.json();
      localStorage.setItem(LS_KEY, JSON.stringify(js));
      return js;
    }
  } catch (e) {}
  const raw = localStorage.getItem(LS_KEY);
  if (raw) try { return JSON.parse(raw); } catch(e){}
  return [];
}

export async function post({text='', when=null}) {
  const list = await load();
  const entry = { text, when: when || new Date().toISOString() };
  list.unshift(entry);
  await save(list);
  return entry;
}

export async function save(list) { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
export function download() {
  const raw = localStorage.getItem(LS_KEY) || '[]';
  const blob = new Blob([raw], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'messages.json'; document.body.appendChild(a); a.click(); a.remove();
}

export async function import(obj) {
  if (!Array.isArray(obj)) throw new Error('Invalid messages JSON');
  await save(obj);
}
