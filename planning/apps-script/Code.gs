// ═══════════════════════════════════════════════════════════
// WPC Hub — Apps Script (Report + lista compartilhada de publishers)
// Compatível com a extensão v3.3.0+ e com versões antigas
// (versões antigas só não enviam os e-mails → N e O ficam vazias).
// ═══════════════════════════════════════════════════════════

// Aba onde ficam os publishers cadastrados pelo botão "Add new publisher".
// É criada automaticamente no fim da planilha (nunca vira a primeira aba).
const PUBLISHERS_SHEET = 'Publishers';
const PUBLISHERS_HEADER = ['Name', 'Email', 'Added by', 'Added by email', 'Added at'];

// Mesma regra da extensão: só e-mails @cheil.com
const CHEIL_EMAIL_RE = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@cheil\.com$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidCheilEmail(email) {
  const value = normalizeEmail(email);
  return CHEIL_EMAIL_RE.test(value) && value.indexOf('..') === -1;
}

function normalizeName(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET: lista de publishers cadastrados ──────────────────
// Chamado pela extensão com ?action=publishers
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  try {
    if (action === 'publishers') {
      return json({ result: 'success', publishers: listPublishers() });
    }
    return json({ result: 'error', error: 'Unknown action' });
  } catch (err) {
    Logger.log('Erro doGet: ' + err.toString());
    return json({ result: 'error', error: err.toString() });
  }
}

// ── POST: report (padrão), addPublisher, removePublisher ──
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const data = JSON.parse(e.postData.contents);
    Logger.log('Dados recebidos: ' + JSON.stringify(data));

    switch (data.action) {
      case 'addPublisher':    return json(addPublisher(data));
      case 'removePublisher': return json(removePublisher(data));
      default:                return json(saveReport(data));
    }
  } catch (err) {
    Logger.log('Erro: ' + err.toString());
    return json({ result: 'error', error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ── Report ────────────────────────────────────────────────
function saveReport(data) {
  // E-mails são opcionais (versões antigas não enviam),
  // mas se vierem precisam ser @cheil.com
  const qaEmail        = normalizeEmail(data.qaEmail);
  const publisherEmail = normalizeEmail(data.publisherEmail);
  if (qaEmail && !isValidCheilEmail(qaEmail)) {
    return { result: 'error', error: 'QA e-mail must be @cheil.com' };
  }
  if (publisherEmail && !isValidCheilEmail(publisherEmail)) {
    return { result: 'error', error: 'Publisher e-mail must be @cheil.com' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sempre grava na primeira aba da planilha — sem criar aba nova por ano,
  // pra evitar que o WPC Hub e o Looker Studio (que apontam pra uma aba
  // específica) parem de receber dados quando o ano virar.
  const sheet = ss.getSheets()[0];

  const lastRow = sheet.getLastRow();
  const maxRows = sheet.getMaxRows();
  if (maxRows - lastRow < 10) {
    sheet.insertRowsAfter(maxRows, 1000);
  }

  // ===== CALCULA MÊS E ANO DA DATA (2026/01/21) =====
  const dateParts = String(data.date || '').split('/');
  const year = dateParts[0] || '';
  const monthNumber = parseInt(dateParts[1], 10);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const month = monthNames[monthNumber - 1] || '';
  // ===================================================

  sheet.appendRow([
    data.ticketUrl || '',        // A
    data.category || '',         // B
    data.sub || '',              // C
    data.status || '',           // D
    data.publisherError || '',   // E
    data.pendingCustomer || '',  // F
    data.reason || '',           // G
    data.date || '',             // H
    data.qa || '',               // I - Nome do QA
    data.comments || '',         // J
    month,                       // K
    year,                        // L
    data.publisher || '',        // M - Nome do author (publisher)
    qaEmail,                     // N - Email QA
    publisherEmail               // O - Email Publisher
  ]);

  Logger.log('Dados inseridos!');
  return { result: 'success' };
}

// ── Publishers compartilhados ─────────────────────────────
function getPublishersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PUBLISHERS_SHEET);
  if (!sheet) {
    // Cria no FIM da planilha para não mudar qual é a primeira aba
    sheet = ss.insertSheet(PUBLISHERS_SHEET, ss.getSheets().length);
    sheet.appendRow(PUBLISHERS_HEADER);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, PUBLISHERS_HEADER.length).setFontWeight('bold');
  }
  return sheet;
}

function readPublisherRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 2).getValues()
    .map(function (r, i) {
      return { row: i + 2, name: String(r[0] || '').trim(), email: normalizeEmail(r[1]) };
    })
    .filter(function (p) { return p.name && isValidCheilEmail(p.email); });
}

function listPublishers() {
  return readPublisherRows(getPublishersSheet())
    .map(function (p) { return { name: p.name, email: p.email }; });
}

function addPublisher(data) {
  const name  = String(data.name || '').trim().replace(/\s+/g, ' ');
  const email = normalizeEmail(data.email);

  if (!name || name.split(' ').length < 2) {
    return { result: 'error', error: 'First and last name are required.' };
  }
  if (!isValidCheilEmail(email)) {
    return { result: 'error', error: 'Only @cheil.com e-mails are allowed.' };
  }

  const sheet = getPublishersSheet();
  const existing = readPublisherRows(sheet);
  const n = normalizeName(name);
  for (var i = 0; i < existing.length; i++) {
    if (normalizeName(existing[i].name) === n) {
      return { result: 'error', error: existing[i].name + ' is already on the list.' };
    }
    if (existing[i].email === email) {
      return { result: 'error', error: 'This e-mail belongs to ' + existing[i].name + '.' };
    }
  }

  const addedByEmail = normalizeEmail(data.addedByEmail);
  sheet.appendRow([
    name,
    email,
    data.addedBy || '',
    isValidCheilEmail(addedByEmail) ? addedByEmail : '',
    new Date()
  ]);

  return { result: 'success', publishers: listPublishers() };
}

function removePublisher(data) {
  const n = normalizeName(data.name);
  const sheet = getPublishersSheet();
  const rows = readPublisherRows(sheet);

  // Apaga de baixo para cima para não deslocar os índices
  for (var i = rows.length - 1; i >= 0; i--) {
    if (normalizeName(rows[i].name) === n) sheet.deleteRow(rows[i].row);
  }
  return { result: 'success', publishers: listPublishers() };
}
