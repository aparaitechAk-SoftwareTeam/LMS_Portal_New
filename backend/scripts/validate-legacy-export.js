/*
 * Read-only migration preflight.
 * Usage: node scripts/validate-legacy-export.js path/to/legacy-export.json
 * It never connects to or writes into MongoDB.
 */
const fs = require('fs');
const path = require('path');

const exportPath = process.argv[2];
if (!exportPath) {
  console.error('Usage: node scripts/validate-legacy-export.js path/to/legacy-export.json');
  process.exit(1);
}

const absolutePath = path.resolve(exportPath);
if (!fs.existsSync(absolutePath)) {
  console.error(`Export file not found: ${absolutePath}`);
  process.exit(1);
}

let payload;
try { payload = JSON.parse(fs.readFileSync(absolutePath, 'utf8')); }
catch (error) { console.error(`Invalid JSON export: ${error.message}`); process.exit(1); }

const collections = ['users', 'interns', 'courses', 'enrollments', 'projects', 'tasks', 'submissions', 'attendance', 'teams', 'certificates', 'payments'];
const report = { source: absolutePath, generatedAt: new Date().toISOString(), collections: {}, issues: [] };

for (const name of collections) {
  const rows = Array.isArray(payload[name]) ? payload[name] : [];
  report.collections[name] = { count: rows.length };
}

const emails = new Map();
for (const user of payload.users || []) {
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) report.issues.push({ severity: 'error', collection: 'users', id: user._id, message: 'Missing email' });
  else if (emails.has(email)) report.issues.push({ severity: 'error', collection: 'users', id: user._id, message: `Duplicate email also used by ${emails.get(email)}` });
  else emails.set(email, user._id);
}

for (const intern of payload.interns || []) {
  if (!intern.user) report.issues.push({ severity: 'error', collection: 'interns', id: intern._id, message: 'Missing linked user' });
}

for (const project of payload.projects || []) {
  const progress = Number(project.progress || 0);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) report.issues.push({ severity: 'error', collection: 'projects', id: project._id, message: 'Invalid progress value' });
}

report.summary = {
  errors: report.issues.filter(issue => issue.severity === 'error').length,
  warnings: report.issues.filter(issue => issue.severity === 'warning').length,
  readyForStagingImport: report.issues.every(issue => issue.severity !== 'error')
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.summary.readyForStagingImport ? 0 : 2);
