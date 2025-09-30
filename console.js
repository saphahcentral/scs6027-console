// console.js
import * as Tickets from './tickets.js';
import * as Messages from './messages.js';

// CONFIG
const ADMIN_PASSWORD = 's3cr3t-admin-pass'; // change before going live!

const terminal = document.getElementById('terminal');
const cmdInput = document.getElementById('cmdInput');
const runBtn = document.getElementById('runBtn');
const loginBtn = document.getElementById('loginBtn');
const adminPass = document.getElementById('adminPass');
const fileImport = document.getElementById('fileImport');
const exportTickets = document.getElementById('exportTickets');
const exportMessages = document.getElementById('exportMessages');
const commitRemote = document.getElementById('commitRemote');

let isAdmin = false;

function writeLine(text, cls='line') {
  const el = document.createElement('div'); el.className = cls; el.textContent = text;
  terminal.appendChild(el); terminal.scrollTop = terminal.scrollHeight;
}

function writePrompt(text) {
  writeLine('> ' + text, 'prompt');
}

function clearConsole() { terminal.innerHTML = ''; }

function showHelp() {
  writeLine('SCS6027 CONSOLE - HELP');
  writeLine('help - show this message');
  writeLine('login - open admin login (enter password and click Login)');
  writeLine('view tickets - list tickets (id, subject, status)');
  writeLine('view ticket <id> - show full ticket details');
  writeLine('reply <id> "message" - post admin reply to ticket');
  writeLine('newticket "subject" "body" "email" - create a ticket (public use)');
  writeLine('list messages - show posted messages');
  writeLine('post "message" - post a public admin message (admin only)');
  writeLine('export tickets - download tickets.json');
  writeLine('export messages - download messages.json');
  writeLine('import <tickets|messages> - choose a JSON file to import');
  writeLine('commit - attempt to push data to GitHub (requires token) -- use the Commit to GitHub button to configure.');
}

async function handleCommand(cmd) {
  if (!cmd || !cmd.trim()) return;
  writePrompt(cmd);

  // basic parsing:
  const args = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const clean = args.map(a => a.replace(/^"|"$/g,''));
  const c = clean[0].toLowerCase();

  try {
    if (c === 'help') { showHelp(); return; }
    if (c === 'login') { 
      writeLine('Enter admin password and click Login button.'); return;
    }
    if (c === 'view' && clean[1] === 'tickets') {
      const tickets = await Tickets.load();
      if (!tickets.length) { writeLine('No tickets'); return; }
      tickets.forEach(t => writeLine(`#${t.id} | ${t.subject} | ${t.status}`));
      return;
    }
    if (c === 'view' && clean[1] === 'ticket') {
      const id = clean[2];
      const t = await Tickets.get(Number(id));
      if (!t) { writeLine('Ticket not found'); return; }
      writeLine(JSON.stringify(t, null, 2));
      return;
    }
    if (c === 'reply') {
      if (!isAdmin) { writeLine('Admin only'); return; }
      const id = Number(clean[1]);
      const msg = clean.slice(2).join(' ').replace(/^"|"$/g,'');
      if (!id || !msg) { writeLine('Usage: reply <id> "message"'); return; }
      await Tickets.addReply(id, {from:'admin', text: msg, when: new Date().toISOString()});
      writeLine(`Reply added to ticket #${id}`);
      return;
    }
    if (c === 'newticket') {
      const subject = clean[1] || 'No subject';
      const body = clean[2] || '';
      const email = clean[3] || '';
      const t = await Tickets.create({subject, body, email});
      writeLine(`Ticket created #${t.id}`);
      return;
    }
    if (c === 'list' && clean[1] === 'messages') {
      const msgs = await Messages.load();
      msgs.forEach(m => writeLine(`${m.when} | ${m.text}`));
      return;
    }
    if (c === 'post') {
      if (!isAdmin) { writeLine('Admin only'); return; }
      const msg = clean.slice(1).join(' ').replace(/^"|"$/g,'');
      if (!msg) { writeLine('Usage: post "message"'); return; }
      await Messages.post({text: msg, when: new Date().toISOString()});
      writeLine('Message posted.');
      return;
    }
    if (c === 'export' && clean[1] === 'tickets') {
      Tickets.download();
      writeLine('Export started (download).');
      return;
    }
    if (c === 'export' && clean[1] === 'messages') {
      Messages.download();
      writeLine('Export started (download).');
      return;
    }
    if (c === 'import') {
      const which = clean[1];
      if (which !== 'tickets' && which !== 'messages') { writeLine('Usage: import tickets|messages'); return; }
      fileImport.dataset.target = which;
      fileImport.click();
      writeLine('Choose a JSON file to import.');
      return;
    }
    if (c === 'commit') {
      writeLine('Use the "Commit to GitHub" button to push changes (requires PAT).');
      return;
    }

    writeLine('Unknown command. Type help.');
  } catch (err) {
    writeLine('Error: ' + (err && err.message ? err.message : String(err)));
  }
}

// UI wiring
runBtn.addEventListener('click', ()=> { handleCommand(cmdInput.value); cmdInput.value=''; cmdInput.focus(); });
cmdInput.addEventListener('keydown', (e)=> { if (e.key === 'Enter') { runBtn.click(); } });

loginBtn.addEventListener('click', ()=>{
  if (adminPass.value === ADMIN_PASSWORD) { isAdmin = true; writeLine('Admin login OK'); }
  else { isAdmin = false; writeLine('Admin login FAILED'); }
  adminPass.value='';
});

fileImport.addEventListener('change', async (ev)=>{
  const f = ev.target.files[0]; if (!f) return;
  const target = ev.target.dataset.target;
  const text = await f.text();
  try {
    const obj = JSON.parse(text);
    if (target === 'tickets') { await Tickets.import(obj); writeLine('Imported tickets JSON (local).'); }
    else { await Messages.import(obj); writeLine('Imported messages JSON (local).'); }
  } catch(e){
    writeLine('Invalid JSON file.');
  } finally { ev.target.value = ''; delete ev.target.dataset.target; }
});

exportTickets.addEventListener('click', ()=> { Tickets.download(); writeLine('Export started (download)'); });
exportMessages.addEventListener('click', ()=> { Messages.download(); writeLine('Export started (download)'); });

commitRemote.addEventListener('click', async ()=>{
  // Simple UI prompt for GitHub settings (token, owner, repo, branch)
  if (!confirm('Commit to GitHub will require a PAT (repo access). Proceed?')) return;
  const token = prompt('Paste GitHub Personal Access Token (will not be stored):');
  if (!token) { writeLine('No token supplied'); return; }
  const owner = prompt('GitHub owner (username/org):');
  const repo = prompt('Repository name:');
  const branch = prompt('Branch (default: main):') || 'main';
  if (!owner || !repo) { writeLine('Missing owner/repo'); return; }

  writeLine('Attempting to push data to GitHub (this uses the token you entered)...');
  try {
    // Collect latest data
    const tickets = await Tickets.load();
    const messages = await Messages.load();
    const commits = [];
    // Prepare files
    await pushFileToGitHub(token, owner, repo, branch, 'data/tickets.json', JSON.stringify(tickets, null, 2), 'Update tickets via console');
    await pushFileToGitHub(token, owner, repo, branch, 'data/messages.json', JSON.stringify(messages, null, 2), 'Update messages via console');
    writeLine('Attempted push (check repository).');
  } catch (err) {
    writeLine('GitHub push failed: ' + (err.message||err));
  }
});

// helper GitHub file updater (uses simple create or update)
async function pushFileToGitHub(token, owner, repo, branch, pathInRepo, content, commitMessage){
  // get file SHA (if exists)
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(pathInRepo)}`;
  const headers = { Authorization: 'token ' + token, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' };
  // get existing
  let sha = null;
  const getRes = await fetch(`${apiBase}?ref=${branch}`, {headers});
  if (getRes.status === 200) {
    const meta = await getRes.json(); sha = meta.sha;
  }
  const body = { message: commitMessage, content: btoa(unescape(encodeURIComponent(content))), branch };
  if (sha) body.sha = sha;
  const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const txt = await putRes.text();
    throw new Error(`GitHub API error: ${putRes.status} ${txt}`);
  }
  return await putRes.json();
}

// initial greeting
writeLine('SCS6027 Console loaded. Type help to begin.');
