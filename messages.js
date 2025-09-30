// messages.js
const M_PATH = './DATA/messages.json';  // corrected to match your /DATA folder
const LS_KEY = 'scs6027_messages';

/**
 * Load messages from JSON file or localStorage fallback
 */
export async function load() {
  try {
    const res = await fetch(M_PATH, { cache: "no-store" });
    if (res.ok) {
      const js = await res.json();
      localStorage.setItem(LS_KEY, JSON.stringify(js));
      return js;
    }
  } catch (e) {
    console.warn("Fetch failed, using localStorage fallback.", e);
  }

  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {
      console.error("Failed to parse messages from localStorage:", e);
    }
  }
  return [];
}

/**
 * Add a new message
 * @param {Object} param0 
 * @param {string} param0.text Message text
 * @param {string|null} param0.when Timestamp
 * @returns Entry object
 */
export async function post({ text = '', when = null }) {
  if (!text.trim()) throw new Error("Message text cannot be empty");

  const list = await load();
  const entry = { text, when: when || new Date().toISOString() };
  list.unshift(entry);
  await save(list);
  return entry;
}

/**
 * Save messages list to localStorage
 * @param {Array} list 
 */
export async function save(list) {
  if (!Array.isArray(list)) throw new Error("List must be an array");
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/**
 * Download messages as JSON file
 */
export function download() {
  const raw = localStorage.getItem(LS_KEY) || '[]';
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'messages.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Import messages from an array of objects
 * @param {Array} obj 
 */
export async function importMessages(obj) {
  if (!Array.isArray(obj)) throw new Error('Invalid messages JSON');
  await save(obj);
}
