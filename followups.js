// followups.js
// Node.js module to manage ticket follow-ups for SCS6027 Console

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { sendEmail } = require("./saphahemailservices"); // Make sure saphahemailservices exposes this function

const DATA_DIR = path.join(__dirname, "DATA");
const FOLLOWUPS_FILE = path.join(DATA_DIR, "followups.json");
const LOG_FILE = path.join(DATA_DIR, "followups-log.txt");

// Ensure DATA folder exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Load existing follow-ups
let followups = [];
if (fs.existsSync(FOLLOWUPS_FILE)) {
  try {
    followups = JSON.parse(fs.readFileSync(FOLLOWUPS_FILE, "utf-8"));
  } catch (err) {
    console.error("Error parsing followups.json:", err);
  }
}

// Utility: save follow-ups to file
function saveFollowups() {
  try {
    fs.writeFileSync(FOLLOWUPS_FILE, JSON.stringify(followups, null, 2));
    appendLog(`Follow-ups saved. Total entries: ${followups.length}`);
  } catch (err) {
    console.error("Error saving followups.json:", err);
    appendLog(`❌ Failed to save followups.json: ${err}`);
  }
}

// Utility: commit follow-ups to GitHub
function commitFollowups() {
  try {
    execSync("git config --local user.name 'GitHub Action'");
    execSync("git config --local user.email 'actions@github.com'");
    execSync(`git add ${FOLLOWUPS_FILE}`);
    execSync(`git commit -m "Add follow-ups [ci skip]" || echo "No new follow-ups to commit"`);
    execSync("git push origin main");
    appendLog("✅ Follow-ups committed to GitHub");
  } catch (err) {
    console.error("Git commit failed:", err);
    appendLog(`❌ Git commit failed: ${err}`);
  }
}

// Utility: append to log
function appendLog(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

// Add a follow-up
async function addFollowup(ticketId, author, message) {
  const newFollowup = {
    id: followups.length + 1,
    ticketId,
    author: author || "admin",
    message,
    timestamp: new Date().toISOString(),
  };

  followups.push(newFollowup);
  saveFollowups();

  // Send email via saphahemailservices
  try {
    await sendEmail({
      to: process.env.TICKET_OWNER_EMAIL || "recipient@example.com",
      subject: `Follow-up for Ticket #${ticketId}`,
      body: `Author: ${newFollowup.author}\n\n${newFollowup.message}\n\nTimestamp: ${newFollowup.timestamp}`,
    });
    appendLog(`✅ Email sent for follow-up ID ${newFollowup.id}`);
  } catch (err) {
    console.error("Email sending failed:", err);
    appendLog(`❌ Email failed for follow-up ID ${newFollowup.id}: ${err}`);
  }

  // Commit changes
  commitFollowups();

  return newFollowup;
}

// List follow-ups for a ticket
function listFollowups(ticketId) {
  return followups.filter(f => f.ticketId === ticketId);
}

// Export functions
module.exports = {
  addFollowup,
  listFollowups,
};
