const totalPointsInput = document.getElementById('totalPoints');
const achievedPointsInput = document.getElementById('achievedPoints');
const percentageEl = document.getElementById('percentage');
const gradeEl = document.getElementById('grade');

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