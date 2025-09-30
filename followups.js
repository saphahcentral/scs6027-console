// followups.js
// Handles adding and listing ticket follow-ups

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DATA_DIR = path.join(__dirname, "DATA");
const FOLLOWUPS_FILE = path.join(DATA_DIR, "followups.json");

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

// Add a follow-up
function addFollowup(ticketId, author, message) {
  const newFollowup = {
    id: followups.length + 1,
    ticketId,
    author,
    message,
    timestamp: new Date().toISOString()
  };
  followups.push(newFollowup);
  saveFollowups();
  console.log("✅ Follow-up added:", newFollowup);
  commitFollowups();
  return newFollowup;
}

// List follow-ups for a ticket
function listFollowups(ticketId) {
  return followups.filter(f => f.t
