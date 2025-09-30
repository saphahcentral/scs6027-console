// tickets.js
const T_PATH = './data/tickets.json';
const LS_KEY = 'scs6027_tickets';

export async function load() {
  // Try fetch from /data/tickets.json then fallback to localStorage
  try {
    const res = await fetch(T_PATH, {cache: "no-store"});
    if (res.ok) {
      const js = await res.json();
      // store to localStorage for edits
      localStorage.setItem(LS_KEY, JSON.stringify(js));
      return js;
    }
  } catch (e) { /* ignore */ }
  // fallback
  const raw = localStorage.getItem(LS_KEY);
  if (raw) try { return JSON.parse(raw); } catch(e) {}
  return [];
}

export async function get(id) {
  const list = await load();
  return list.find(t => Number(t.id) === Number(id));
}

export async function save(list) {
  // Save to localStorage only (client-side). To push to repo use console commit.
  localStorage.setItem(LS_KEY, JSON.stringify(list));
  return true;
}

export async function create({subject='(no subject)', body='', email=''}) {
  const list = await load();
  const next = (list.reduce((m,x)=>Math.max(m, Number(x.id)||0), 0) || 0) + 1;
  const ticket = {
    id: next,
    subject,
    body,
    email,
    status: 'open',
    created: new Date().toISOString(),
    replies: []
  };
  list.push(ticket);
  await save(list);
  return ticket;
}

export async function addReply(id, reply) {
  const list = await load();
  const t = list.find(x => Number(x.id) === Number(id));
  if (!t) throw new Error('Ticket not found');
  t.replies = t.replies || [];
  t.replies.push(reply);
  t.status = 'answered';
  await save(list);
  return t;
}

export function download() {
  const raw = localStorage.getItem(LS_KEY) || '[]';
  const blob = new Blob([raw], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tickets.json';
  document.body.appendChild(a); a.click(); a.remove();
}

export async function import(obj) {
  if (!Array.isArray(obj)) throw new Error('Invalid tickets JSON');
  await save(obj);
}

