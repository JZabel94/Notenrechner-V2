const totalPointsInput = document.getElementById('totalPoints');
const achievedPointsInput = document.getElementById('achievedPoints');
const percentageEl = document.getElementById('percentage');
const gradeEl = document.getElementById('grade');

const classTotalPointsInput = document.getElementById('classTotalPoints');
const studentNameInput = document.getElementById('studentName');
const studentAchievedInput = document.getElementById('studentAchieved');
const addEntryBtn = document.getElementById('addEntryBtn');
const entriesList = document.getElementById('entries-list');
const averageDisplay = document.getElementById('averageDisplay');

const modeBtns = document.querySelectorAll('.mode-btn');
const singleMode = document.getElementById('single-mode');
const classMode = document.getElementById('class-mode');
const ambiguityPicker = document.getElementById('ambiguity-picker');
const ambiguityOptions = document.getElementById('ambiguity-options');
const ambiguityConfirm = document.getElementById('ambiguity-confirm');
const ambiguityCancel = document.getElementById('ambiguity-cancel');

const GRADE_SCALE = [
  { min: 99, max: 100, grade: '1' },
  { min: 97, max: 98, grade: '1−' },
  { min: 95, max: 96, grade: '2+' },
  { min: 86, max: 94, grade: '2' },
  { min: 84, max: 85, grade: '2−' },
  { min: 82, max: 83, grade: '3+' },
  { min: 70, max: 81, grade: '3' },
  { min: 68, max: 69, grade: '3−' },
  { min: 66, max: 67, grade: '4+' },
  { min: 52, max: 65, grade: '4' },
  { min: 50, max: 51, grade: '4−' },
  { min: 26, max: 49, grade: '5' },
  { min: 0, max: 25, grade: '6' },
];

function lookupGrade(value) {
  for (const entry of GRADE_SCALE) {
    if (value >= entry.min && value <= entry.max) {
      return entry.grade;
    }
  }
  return '—';
}

function getGrade(percent) {
  const rounded = Math.round(percent);
  const isHalf = Math.abs(percent - Math.floor(percent) - 0.5) < 0.0001;

  if (isHalf) {
    const lower = lookupGrade(Math.floor(percent));
    const upper = lookupGrade(Math.ceil(percent));
    if (lower === upper) return lower;
    return lower + ' / ' + upper;
  }

  return lookupGrade(rounded);
}

const GRADE_TO_NUM = {
  '1': 1.0, '1−': 1.3,
  '2+': 1.7, '2': 2.0, '2−': 2.3,
  '3+': 2.7, '3': 3.0, '3−': 3.3,
  '4+': 3.7, '4': 4.0, '4−': 4.3,
  '5': 5.0, '6': 6.0,
};

const NUM_TO_GRADE = [
  { num: 1.0, grade: '1' },
  { num: 1.3, grade: '1−' },
  { num: 1.7, grade: '2+' },
  { num: 2.0, grade: '2' },
  { num: 2.3, grade: '2−' },
  { num: 2.7, grade: '3+' },
  { num: 3.0, grade: '3' },
  { num: 3.3, grade: '3−' },
  { num: 3.7, grade: '4+' },
  { num: 4.0, grade: '4' },
  { num: 4.3, grade: '4−' },
  { num: 5.0, grade: '5' },
  { num: 6.0, grade: '6' },
];

function gradeToNum(grade) {
  return GRADE_TO_NUM[grade] !== undefined ? GRADE_TO_NUM[grade] : null;
}

function numToGrade(num) {
  let closest = NUM_TO_GRADE[0];
  for (const entry of NUM_TO_GRADE) {
    if (Math.abs(entry.num - num) < Math.abs(closest.num - num)) {
      closest = entry;
    }
  }
  return closest.grade;
}

let classEntries = [];
let currentMode = 'single';
let pendingEntry = null;

function renderGradeTable() {
  const table = document.getElementById('grade-table');
  table.innerHTML = '<tr><th>Note</th><th>Prozentbereich</th></tr>';
  for (const entry of GRADE_SCALE) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${entry.grade}</td><td>${entry.max}–${entry.min}%</td>`;
    table.appendChild(row);
  }
}

function switchMode(mode) {
  currentMode = mode;
  hideAmbiguityPicker();
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  singleMode.hidden = mode !== 'single';
  classMode.hidden = mode !== 'class';

  localStorage.setItem('notenrechner_mode', mode);
  if (mode === 'class') {
    renderEntries();
    updateAverage();
  }
}

function getNextAutoName() {
  let maxNum = 0;
  for (const entry of classEntries) {
    const num = parseInt(entry.name, 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  return String(maxNum + 1);
}

function calcPercent(achieved, total) {
  if (!total || total <= 0) return null;
  return Math.max(0, Math.min(100, (achieved / total) * 100));
}

function addEntry(name, achieved) {
  const total = parseFloat(classTotalPointsInput.value);
  if (isNaN(total) || total <= 0) {
    alert('Bitte zuerst eine gültige Gesamtpunktzahl eingeben.');
    return false;
  }
  if (isNaN(achieved) || achieved < 0) {
    alert('Bitte eine gültige erreichte Punktzahl eingeben.');
    return false;
  }

  const pct = calcPercent(achieved, total);
  const grade = getGrade(pct);

  if (grade.includes(' / ')) {
    const parts = grade.split(' / ');
    showAmbiguityPicker(parts, (selected) => {
      classEntries.push({ id: Date.now(), name: name || getNextAutoName(), achieved, grade: selected });
      saveClassEntries();
      renderEntries();
      updateAverage();
      studentAchievedInput.value = '';
      studentNameInput.value = '';
    });
    return true;
  }

  classEntries.push({ id: Date.now(), name: name || getNextAutoName(), achieved, grade });
  saveClassEntries();
  renderEntries();
  updateAverage();
  studentAchievedInput.value = '';
  studentNameInput.value = '';
  return true;
}

let ambiguityResolve = null;

function showAmbiguityPicker(options, onSelect) {
  ambiguityOptions.innerHTML = '';
  options.forEach((opt, i) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'ambiguity-grade';
    radio.value = opt;
    if (i === 0) radio.checked = true;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(opt));
    ambiguityOptions.appendChild(label);
  });
  ambiguityPicker.hidden = false;
  ambiguityResolve = onSelect;
}

function hideAmbiguityPicker() {
  ambiguityPicker.hidden = true;
  ambiguityResolve = null;
  renderEntries();
}

ambiguityCancel.addEventListener('click', hideAmbiguityPicker);

ambiguityConfirm.addEventListener('click', () => {
  const selected = ambiguityOptions.querySelector('input[name="ambiguity-grade"]:checked');
  if (!selected) return;
  ambiguityPicker.hidden = true;
  if (ambiguityResolve) {
    ambiguityResolve(selected.value);
    ambiguityResolve = null;
  }
});

function deleteEntry(id) {
  classEntries = classEntries.filter(e => e.id !== id);
  saveClassEntries();
  renderEntries();
  updateAverage();
}

function startEdit(id) {
  const entry = classEntries.find(e => e.id === id);
  if (!entry) return;
  const row = document.querySelector(`[data-id="${id}"]`);
  if (!row) return;

  const total = parseFloat(classTotalPointsInput.value) || 0;
  const pct = calcPercent(entry.achieved, total);
  const pctStr = pct !== null ? pct.toFixed(2) + '%' : '—';

  row.classList.add('editing');
  row.innerHTML = `
    <input class="edit-input edit-name-input" type="text" value="${escapeHtml(entry.name)}">
    <input class="edit-input edit-points-input" type="number" min="0" step="any" value="${entry.achieved}">
    <span class="entry-pct">${pctStr}</span>
    <span class="entry-grade">${entry.grade}</span>
    <div class="edit-actions">
      <button class="btn-icon save" title="Speichern">✓</button>
      <button class="btn-icon cancel" title="Abbrechen">✗</button>
    </div>
  `;
}

function saveEdit(id) {
  const row = document.querySelector(`[data-id="${id}"]`);
  if (!row) return;

  const nameInput = row.querySelector('.edit-name-input');
  const pointsInput = row.querySelector('.edit-points-input');
  const gradeSpan = row.querySelector('.entry-grade');

  const newName = nameInput.value.trim() || '—';
  const newAchieved = parseFloat(pointsInput.value);

  if (isNaN(newAchieved) || newAchieved < 0) {
    alert('Bitte eine gültige Punktzahl eingeben.');
    return;
  }

  const total = parseFloat(classTotalPointsInput.value) || 0;
  const pct = calcPercent(newAchieved, total);
  const grade = getGrade(pct);

  if (grade.includes(' / ')) {
    const parts = grade.split(' / ');
    showAmbiguityPicker(parts, (selected) => {
      const entry = classEntries.find(e => e.id === id);
      if (!entry) return;
      entry.name = newName;
      entry.achieved = newAchieved;
      entry.grade = selected;
      saveClassEntries();
      renderEntries();
      updateAverage();
    });
    return;
  }

  const entry = classEntries.find(e => e.id === id);
  if (!entry) return;
  entry.name = newName;
  entry.achieved = newAchieved;
  entry.grade = grade;
  saveClassEntries();
  renderEntries();
  updateAverage();
}

function cancelEdit(id) {
  renderEntries();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderEntries() {
  if (!entriesList) return;
  if (classEntries.length === 0) {
    entriesList.innerHTML = '<div class="entries-empty">Noch keine Einträge</div>';
    return;
  }

  const total = parseFloat(classTotalPointsInput.value) || 0;

  let html = '';
  for (const entry of classEntries) {
    const pct = calcPercent(entry.achieved, total);
    const pctStr = pct !== null ? pct.toFixed(2) + '%' : '—';
    html += `
      <div class="entry-row" data-id="${entry.id}">
        <span class="entry-name">${escapeHtml(entry.name)}</span>
        <span class="entry-points">${entry.achieved}</span>
        <span class="entry-pct">${pctStr}</span>
        <span class="entry-grade">${entry.grade}</span>
        <div class="entry-actions">
          <button class="btn-icon edit" data-action="edit" title="Bearbeiten">✎</button>
          <button class="btn-icon delete" data-action="delete" title="Löschen">✕</button>
        </div>
      </div>`;
  }
  entriesList.innerHTML = html;
}

function updateAverage() {
  if (!averageDisplay) return;
  if (classEntries.length === 0) {
    averageDisplay.textContent = '—';
    return;
  }

  let sum = 0;
  let count = 0;
  for (const entry of classEntries) {
    const num = gradeToNum(entry.grade);
    if (num !== null) {
      sum += num;
      count++;
    }
  }

  if (count === 0) {
    averageDisplay.textContent = '—';
    return;
  }

  const avgNum = sum / count;
  const avgGrade = numToGrade(avgNum);
  averageDisplay.textContent = avgGrade + ' (' + avgNum.toFixed(2) + ')';
}

function saveClassEntries() {
  localStorage.setItem('notenrechner_classEntries', JSON.stringify(classEntries));
}

function loadState() {
  const savedMode = localStorage.getItem('notenrechner_mode');
  if (savedMode === 'class' || savedMode === 'single') {
    switchMode(savedMode);
  }

  const saved = localStorage.getItem('notenrechner_classEntries');
  if (saved) {
    try {
      classEntries = JSON.parse(saved);
    } catch (e) {
      classEntries = [];
    }
  }

  const savedClassTotal = localStorage.getItem('notenrechner_classTotal');
  if (savedClassTotal !== null) {
    classTotalPointsInput.value = savedClassTotal;
  }

  renderEntries();
  updateAverage();
}

function calculate() {
  const total = parseFloat(totalPointsInput.value);
  const achieved = parseFloat(achievedPointsInput.value);

  if (isNaN(total) || total <= 0 || isNaN(achieved) || achieved < 0) {
    percentageEl.textContent = '—';
    gradeEl.textContent = '—';
    return;
  }

  const percent = (achieved / total) * 100;
  const clamped = Math.max(0, Math.min(100, percent));

  percentageEl.textContent = clamped.toFixed(2) + '%';
  gradeEl.textContent = getGrade(clamped);
}

totalPointsInput.addEventListener('input', calculate);
achievedPointsInput.addEventListener('input', calculate);

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

addEntryBtn.addEventListener('click', () => {
  const name = studentNameInput.value.trim();
  const achieved = parseFloat(studentAchievedInput.value);
  addEntry(name, achieved);
});

studentAchievedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addEntryBtn.click();
  }
});

classTotalPointsInput.addEventListener('change', () => {
  localStorage.setItem('notenrechner_classTotal', classTotalPointsInput.value);
  renderEntries();
  updateAverage();
});

entriesList.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-icon');
  if (!btn) return;
  const row = btn.closest('.entry-row');
  if (!row) return;
  const id = parseInt(row.dataset.id);

  if (btn.dataset.action === 'delete') {
    deleteEntry(id);
  } else if (btn.dataset.action === 'edit') {
    startEdit(id);
  }
});

entriesList.addEventListener('click', (e) => {
  const btn = e.target.closest('.edit-actions .btn-icon');
  if (!btn) return;
  const row = btn.closest('.entry-row.editing');
  if (!row) return;
  const id = parseInt(row.dataset.id);

  if (btn.classList.contains('save')) {
    saveEdit(id);
  } else if (btn.classList.contains('cancel')) {
    cancelEdit(id);
  }
});

const savedTotal = localStorage.getItem('notenrechner_total');
const savedAchieved = localStorage.getItem('notenrechner_achieved');
if (savedTotal !== null) totalPointsInput.value = savedTotal;
if (savedAchieved !== null) achievedPointsInput.value = savedAchieved;

function saveValues() {
  localStorage.setItem('notenrechner_total', totalPointsInput.value);
  localStorage.setItem('notenrechner_achieved', achievedPointsInput.value);
}

totalPointsInput.addEventListener('change', saveValues);
achievedPointsInput.addEventListener('change', saveValues);

if (savedTotal !== null || savedAchieved !== null) {
  calculate();
}

renderGradeTable();
loadState();
