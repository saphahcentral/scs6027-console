// students.js
// Handles adding and listing students

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DATA_DIR = path.join(__dirname, "DATA");
const STUDENTS_FILE = path.join(DATA_DIR, "students.json");

// Ensure DATA folder exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Load existing students
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  try {
    students = JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf-8"));
  } catch (err) {
    console.error("Error parsing students.json:", err);
  }
}

// Add a student
function addStudent(name, email) {
  const newStudent = {
    id: students.length + 1,
    name,
    email,
    createdAt: new Date().toISOString()
  };
  students.push(newStudent);
  saveStudents();
  console.log("✅ Student added:", newStudent);
  commitStudents();
  return newStudent;
}

// List all students
function listStudents() {
  return students;
}

// Save students to file
function saveStudents() {
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf-8");
}

// Commit students to GitHub
function commitStudents() {
  try {
    execSync('git config --local user.name "GitHub Action"');
    execSync('git config --local user.email "actions@github.com"');
    execSync(`git add "${STUDENTS_FILE}"`);
    execSync('git commit -m "Update students [ci skip]" || echo "No new students to commit"');
    execSync("git push origin main");
    console.log("✅ Students committed to repository.");
  } catch (err) {
    console.error("⚠️ Git commit failed (likely no changes):", err.message);
  }
}

// Export functions
module.exports = { addStudent, listStudents };
