// ============================================================
//  CODE.GS — Foothold · GPU Computing for AI (courseId "course_GPU")
//  Bound to the Google Sheet "course_GPU".
//
//  ONE-TIME SETUP (in the Sheet):
//   1. Extensions → Apps Script → paste this whole file → Save.
//   2. Reload the Sheet → menu "Foothold GPU" → "1. Set up sheets".
//      (Approve the permission prompt the first time.)
//   3. Apps Script → Deploy → New deployment → type "Web app"
//      → Execute as: Me · Who has access: Anyone → Deploy.
//   4. Copy the /exec URL into config/gas.config.js in course_GPU.
//  After ANY later change to this file: Deploy → Manage deployments
//  → edit → Version: New version → Deploy (the URL stays the same).
//
//  The request handlers below are identical to the COA/Python
//  courses, so the Foothold app needs no changes.
// ============================================================

const COURSE_ID = 'course_GPU';

// The 35 units, copied from config/course.config.js (unitId, module, module title, unit title)
const UNITS = [
  ["Unit1_1","M1","What Is AI, Really?","Rules vs Learning"],
  ["Unit1_2","M1","What Is AI, Really?","Everything Is Numbers"],
  ["Unit1_3","M1","What Is AI, Really?","The Neuron"],
  ["Unit1_4","M1","What Is AI, Really?","Learning = Reducing Error"],
  ["Unit1_5","M1","What Is AI, Really?","Layers = Matrix Multiplication"],
  ["Unit1_C","M1","What Is AI, Really?","Capstone: Train a Tiny Network"],
  ["Unit2_1","M2","Why Is AI So Hungry?","Counting the Multiply-Adds"],
  ["Unit2_2","M2","Why Is AI So Hungry?","Training vs Inference, Epochs & Batches"],
  ["Unit2_3","M2","Why Is AI So Hungry?","Every Output Is Independent"],
  ["Unit2_C","M2","Why Is AI So Hungry?","Capstone: The Compute Bill"],
  ["Unit3_1","M3","CPU vs GPU","Latency vs Throughput"],
  ["Unit3_2","M3","CPU vs GPU","Why Clocks Stopped Getting Faster"],
  ["Unit3_3","M3","CPU vs GPU","SIMD → SIMT"],
  ["Unit3_4","M3","CPU vs GPU","Amdahl's Law"],
  ["Unit3_C","M3","CPU vs GPU","Capstone: CPU or GPU?"],
  ["Unit4_1","M4","Inside a GPU","SMs, Cores & Tensor Cores"],
  ["Unit4_2","M4","Inside a GPU","Warps & Branch Divergence"],
  ["Unit4_3","M4","Inside a GPU","Hiding Latency"],
  ["Unit4_4","M4","Inside a GPU","GPU Memory & Bandwidth"],
  ["Unit4_C","M4","Inside a GPU","Capstone: Map a Job onto a GPU"],
  ["Unit5_1","M5","CPU–GPU Teamwork","Host & Device on PCIe"],
  ["Unit5_2","M5","CPU–GPU Teamwork","The Five Steps of Offloading"],
  ["Unit5_3","M5","CPU–GPU Teamwork","Kernels, Grids, Blocks, Threads"],
  ["Unit5_4","M5","CPU–GPU Teamwork","Async Launch & Synchronization"],
  ["Unit5_C","M5","CPU–GPU Teamwork","Capstone: Where Did the Time Go?"],
  ["Unit6_1","M6","Why GPUs Make AI Fast","Parallel Matrix Multiply & Tiling"],
  ["Unit6_2","M6","Why GPUs Make AI Fast","Precision: FP32 → FP16/BF16 → INT8"],
  ["Unit6_3","M6","Why GPUs Make AI Fast","Compute-bound vs Memory-bound"],
  ["Unit6_4","M6","Why GPUs Make AI Fast","Batch Size & Training on GPU"],
  ["Unit6_C","M6","Why GPUs Make AI Fast","Capstone: Speed Up a Training Run"],
  ["Unit7_1","M7","GPUs in Real AI Projects","The Software Stack"],
  ["Unit7_2","M7","GPUs in Real AI Projects","Will It Fit? Sizing GPU Memory"],
  ["Unit7_3","M7","GPUs in Real AI Projects","nvidia-smi & Out-of-Memory"],
  ["Unit7_4","M7","GPUs in Real AI Projects","Many GPUs & Other Accelerators"],
  ["Unit7_C","M7","GPUs in Real AI Projects","Grand Capstone: Plan an AI Project"]
];

function doGet(e) {
  return handleRequest(e.parameter);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    let body;
    try { body = JSON.parse(e.postData.contents); } catch { body = e.parameter; }
    const result = routeAction(body);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function handleRequest(params) {
  try {
    return ContentService.createTextOutput(JSON.stringify(routeAction(params))).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function routeAction(body) {
  switch (body.action) {
    case 'login':        return handleLogin(body);
    case 'register':     return handleRegister(body);
    case 'saveProgress': return handleSaveProgress(body);
    case 'getProgress':  return handleGetProgress(body);
    case 'logEvent':     return handleLogEvent(body);
    default:             return { success: false, message: 'Unknown action' };
  }
}

// ------------------------------------------------------------
// Usage analytics. One row per event: a page/session started,
// a lesson was opened, a lesson was completed, or someone signed
// up. AnonId identifies a browser even for guests who never log
// in; UserId is filled in only once someone is signed in. Creates
// the Events tab itself on first call, so no manual sheet setup
// is required beyond redeploying this script.
// ------------------------------------------------------------
function handleLogEvent(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Events');
  if (!sheet) {
    sheet = ss.insertSheet('Events');
    sheet.appendRow(['Timestamp', 'AnonId', 'UserId', 'EventType', 'CourseId', 'UnitId']);
  }
  sheet.appendRow([
    new Date().toISOString(),
    body.anonId || '',
    body.userId || '',
    body.eventType || '',
    body.courseId || '',
    body.unitId || '',
  ]);
  return { success: true };
}

function handleLogin(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const [rollNo, password, name, batch, email] = data[i];
    if (String(rollNo).trim() === String(body.rollNo).trim() &&
        String(password).trim() === String(body.password).trim()) {
      return { success: true, student: { rollNo: String(rollNo), name, batch, email } };
    }
  }
  return { success: false, message: 'Invalid roll number or password.' };
}

// ------------------------------------------------------------
// Self-registration for the public, worldwide version of the
// course (as opposed to professor-provisioned SRFET students,
// who are added to the Students sheet by hand and use handleLogin
// above). Here the "username" a learner logs in with IS their
// email address, and the password is one they invent for this
// site only -- it is never their real email account password.
// The same Students sheet holds both kinds of rows; column 0
// (historically "RollNo") just becomes the login handle, whether
// that's a roll number or an email address. Column layout stays
// identical so handleLogin/handleGetProgress/handleSaveProgress
// don't need to change at all.
// ------------------------------------------------------------
function handleRegister(body) {
  const email = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '').trim();
  const name = String(body.name || '').trim();

  if (!email || !password || !name) {
    return { success: false, message: 'Name, email, and password are all required.' };
  }
  // Very light email shape check -- the real validation (does this
  // inbox exist) isn't something Apps Script can do, so we don't try.
  if (email.indexOf('@') === -1) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Please choose a password with at least 6 characters.' };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === email) {
      return { success: false, message: 'An account with this email already exists. Please sign in instead.' };
    }
  }

  // Row shape matches handleLogin's [rollNo, password, name, batch, email]:
  // rollNo slot = the email (that's what they'll type in to sign back in),
  // batch slot marks this as a self-registered public account (not a batch year).
  sheet.appendRow([email, password, name, 'Self-registered', email]);
  return { success: true, student: { rollNo: email, name, batch: 'Self-registered', email } };
}

function handleSaveProgress(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.rollNo) &&
        String(data[i][1]) === String(body.courseId) &&
        String(data[i][2]) === String(body.unitId)) {
      return { success: true, message: 'Already recorded.' };
    }
  }
  sheet.appendRow([body.rollNo, body.courseId, body.unitId, new Date().toISOString()]);
  return { success: true };
}

function handleGetProgress(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Progress');
  const data  = sheet.getDataRange().getValues();
  const units = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.rollNo) &&
        String(data[i][1]) === String(body.courseId)) {
      units.push(String(data[i][2]));
    }
  }
  return { success: true, completedUnits: units };
}

// ------------------------------------------------------------
// Sheet menu + safe setup. Unlike the older courses' setupSheets,
// this NEVER clears existing data: it only adds missing tabs/headers.
// ------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Foothold GPU')
    .addItem('1. Set up sheets', 'setupSheets')
    .addItem('2. Refresh progress summary', 'refreshSummary')
    .addToUi();
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#16294A').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, 'Students', ['RollNo', 'Password', 'Name', 'Batch', 'Email']);
  ensureSheet_(ss, 'Progress', ['RollNo', 'CourseId', 'UnitId', 'CompletedAt']);
  ensureSheet_(ss, 'Events', ['Timestamp', 'AnonId', 'UserId', 'EventType', 'CourseId', 'UnitId']);
  const units = ensureSheet_(ss, 'Units', ['UnitId', 'Module', 'Module title', 'Unit title', 'Students completed']);
  if (units.getLastRow() === 1) {
    units.getRange(2, 1, UNITS.length, 4).setValues(UNITS);
  }
  ensureSheet_(ss, 'Summary', ['RollNo', 'Name', 'Batch', 'Units done', 'Out of', '% complete', 'Last completed']);
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  return 'Sheets ready.';
}

// ------------------------------------------------------------
// Builds the Summary tab (one row per student) and fills the
// "Students completed" column of the Units tab. Run it from the
// menu whenever you want fresh numbers (it only reads Progress).
// ------------------------------------------------------------
function refreshSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets();
  const students = ss.getSheetByName('Students').getDataRange().getValues().slice(1);
  const progress = ss.getSheetByName('Progress').getDataRange().getValues().slice(1)
    .filter(r => String(r[1]) === COURSE_ID && String(r[2]).indexOf('@') === -1);
  const unitIds = UNITS.map(u => u[0]);

  const done = {}, last = {}, perUnit = {};
  progress.forEach(([roll, , unit, at]) => {
    if (unitIds.indexOf(String(unit)) === -1) return;
    const k = String(roll);
    done[k] = done[k] || {};
    done[k][unit] = true;
    if (!last[k] || String(at) > String(last[k])) last[k] = at;
    perUnit[unit] = (perUnit[unit] || 0) + 1;
  });

  const rows = students.filter(s => String(s[0]).trim()).map(([roll, , name, batch]) => {
    const n = Object.keys(done[String(roll)] || {}).length;
    return [String(roll), name, batch, n, unitIds.length, n / unitIds.length, last[String(roll)] || ''];
  }).sort((a, b) => b[3] - a[3]);

  const sum = ss.getSheetByName('Summary');
  if (sum.getLastRow() > 1) sum.getRange(2, 1, sum.getLastRow() - 1, 7).clearContent();
  if (rows.length) {
    sum.getRange(2, 1, rows.length, 7).setValues(rows);
    sum.getRange(2, 6, rows.length, 1).setNumberFormat('0%');
  }

  const unitsSheet = ss.getSheetByName('Units');
  unitsSheet.getRange(2, 5, UNITS.length, 1).setValues(UNITS.map(u => [perUnit[u[0]] || 0]));
  return 'Summary refreshed for ' + rows.length + ' students.';
}
