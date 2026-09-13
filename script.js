/* ---------------- MORSE DATA ---------------- */
const MORSE = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....',
  I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.',
  Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-',
  Y:'-.--', Z:'--..', '0':'-----','1':'.----','2':'..---','3':'...--',
  '4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'
};

const hornSound = new Audio('horn.mp3');
const steamSound = new Audio('steam.mp3');
steamSound.loop = true;
steamSound.volume = 0.2;

const steamScenes = ['mission', 'encode', 'npc', 'controller', 'npc-result'];

function handleAudio(sceneId) {
  if (steamScenes.includes(sceneId)) {
    if (steamSound.paused) steamSound.play();
  } else {
    steamSound.pause();
  }
}

function buildCheatsheet(container) {
  const letters = Object.keys(MORSE).filter(k => isNaN(k));
  container.innerHTML = letters.map(l =>
    `<div class="glyph"><b>${l}</b><span>${MORSE[l]}</span></div>`
  ).join('') + `<div class="key-row"><span>● knit = dot</span><span>▬ purl = dash</span></div>`;
}

function toggleCheatsheet() {
  const sheet = document.getElementById('cheatsheet-encode');
  const btn = document.getElementById('cheatsheet-toggle-btn');
  const visible = sheet.style.display !== 'none';
  sheet.style.display = visible ? 'none' : 'grid';
  btn.textContent = visible ? 'Show Cheat Sheet' : 'Hide Cheat Sheet';
}

function toggleTutorialCheatsheet() {
  const sheet = document.getElementById('cheatsheet');
  const btn = document.getElementById('cheatsheet-tutorial-btn');
  const visible = sheet.style.display !== 'none';
  sheet.style.display = visible ? 'none' : 'grid';
  btn.textContent = visible ? 'Show Cheat Sheet' : 'Hide Cheat Sheet';
}


function revealTargetWord() {
  document.getElementById('target-word').style.display = 'block';
  document.getElementById('window-focus-icon').style.display = 'none';
  document.getElementById('window-hint').style.display = 'none';
  document.getElementById('window-clickable').style.cursor = 'default';
  document.getElementById('window-clickable').onclick = null;
}


/* ---------------- SCENE NAV ---------------- */
function goTo(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  document.getElementById('scene-' + id).classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
  handleAudio(id);
}

/* ---------------- TUTORIAL DECODE ---------------- */
const TUTORIAL_WORD = "WIEN";   // the decoded message tells the player where to deliver
let tutorialMorseSeq = [];        // array of {sym, letterIndex} per stitch, 'gap' for spaces
let tutorialRevealed = [];        // parallel boolean array

function setupTutorial() {
  buildCheatsheet(document.getElementById('cheatsheet'));
  tutorialMorseSeq = [];

  TUTORIAL_WORD.split('').forEach((ch) => {
    if (ch === ' ') {
      tutorialMorseSeq.push({ sym: 'gap' });
      return;
    }
    MORSE[ch].split('').forEach(sym => tutorialMorseSeq.push({ sym, letter: ch }));
    tutorialMorseSeq.push({ sym: 'gap' });
  });
  // remove trailing gap
  if (tutorialMorseSeq.length && tutorialMorseSeq[tutorialMorseSeq.length - 1].sym === 'gap') {
    tutorialMorseSeq.pop();
  }

  tutorialRevealed = tutorialMorseSeq.map(() => false);
  renderTutorialGrid();
 
  const answerDisplay = document.getElementById('tutorial-answer-display');
  if (answerDisplay) answerDisplay.textContent =
    TUTORIAL_WORD.split('').map(c => c === ' ' ? '  ' : '?').join(' ');
}

function renderTutorialGrid() {
  const grid = document.getElementById('tutorial-stitches');
  grid.innerHTML = '';
  tutorialMorseSeq.forEach((item, i) => {
    const el = document.createElement('div');
    if (item.sym === 'gap') {
      if (tutorialRevealed[i]) {
        el.className = 'stitch gap-revealed';
        el.textContent = '/';
      } else {
        el.className = 'stitch clickable';
        el.textContent = '?';
        el.onclick = () => revealTutorialStitch(i);
      }
    } else if (tutorialRevealed[i]) {
      el.className = 'stitch ' + (item.sym === '.' ? 'knit' : 'purl');
      el.textContent = item.sym === '.' ? '●' : '▬';
    } else {
      el.className = 'stitch clickable';
      el.textContent = '?';
      el.onclick = () => revealTutorialStitch(i);
    }
    grid.appendChild(el);
  });
}


function updateTutorialAnswer() {
  // figure out which letters are now fully revealed
  let display = '';
  let i = 0;
  TUTORIAL_WORD.split('').forEach((ch) => {
    if (ch === ' ') { display += '  '; return; }
    const len = MORSE[ch].length;
    const slice = tutorialRevealed.slice(i, i + len);
    display += (slice.every(v => v) ? ch : '?') + ' ';
    i += len + 1; // +1 for the gap stitch
  });
  const display1 = document.getElementById('tutorial-answer-display');
  if (display1) display1.textContent = display.trim();
}

function openHat() {
  const grid = document.getElementById('tutorial-stitches');
  const target = document.getElementById('tutorial-stitches-copy');
  target.innerHTML = grid.innerHTML;
  buildCheatsheet(document.getElementById('cheatsheet'));
  buildLetterBoxes();
  goTo('decode-2');
}

function revealTutorialStitch(i) {
  tutorialRevealed[i] = true;
  renderTutorialGrid();
  updateTutorialAnswer();
  checkAllRevealed();
}

function checkAllRevealed() {
  const allDone = tutorialRevealed.every(v => v);
  document.getElementById('look-inside-btn').disabled = !allDone;
}

function revealAllTutorialStitches() {
  tutorialRevealed = tutorialMorseSeq.map(() => true);
  renderTutorialGrid();
  updateTutorialAnswer();
}

function showTutorialSolution() {
  // store the decoded destination for later reference
  window.deliveryPlatform = TUTORIAL_WORD;
  document.getElementById('mission-platform-ref').textContent = TUTORIAL_WORD;
  hornSound.play();
  goTo('mission');
  buildMissionProgress();
}

function buildLetterBoxes() {
  const container = document.getElementById('letter-boxes');
  container.innerHTML = '';
  TUTORIAL_WORD.split('').forEach((letter, i) => {
    const box = document.createElement('span');
    box.className = 'letter-box hidden-letter';
    box.textContent = '_';
    box.onclick = () => revealLetter(box, letter);
    container.appendChild(box);
  });
}

function revealLetter(box, letter) {
  box.textContent = letter;
  box.classList.remove('hidden-letter');
  box.classList.add('revealed-letter');
  box.onclick = null;
}



/* ---------------- MISSION STATE ---------------- */
const OBSERVATIONS = [
  { word: 'TROOPS', text: 'Soldiers massing beside the platform — far more than usual.', image: 'troops.jpeg'},
  { word: 'TANK', text: 'An armored vehicle idles on a flatbed car, half-covered by tarp.', image: 'tank.jpeg'},
  { word: 'BRIDGE', text: 'Engineers inspect the rail bridge ahead, taking careful measurements.', image: 'bridge.jpeg'},
  { word: 'RADIO', text: 'An antenna mast rises from a requisitioned farmhouse roof.', image: 'radio.jpeg'},
  { word: 'DAWN', text: 'A convoy departs just before first light, heading north.', image: 'dawn.jpeg'}
];

let currentSighting = 0;
let suspicion = 0;
let currentEncodeSeq = [];   // target morse sequence (symbols + 'gap')
let playerSeq = [];          // what the player has built so far
let passengerInterruptionUsed = false;
let controllerInterruptionUsed = false;

function buildMissionProgress() {
  const wrap = document.getElementById('mission-progress');
  wrap.innerHTML = OBSERVATIONS.map((_, i) =>
    `<div class="dot ${i < currentSighting ? 'filled' : ''}"></div>`
  ).join('');
}

function startObservation() {
  buildEncodeScene();
  goTo('encode');
}

function buildEncodeScene() {
  const obs = OBSERVATIONS[currentSighting];
  document.getElementById('encode-counter').textContent = `Sighting ${currentSighting + 1} of ${OBSERVATIONS.length}`;
  document.getElementById('observation-text').textContent = `"${obs.text}"`;
  document.getElementById('target-word').innerHTML = `<span class="label">Word to encode:</span>${obs.word}`;
  buildCheatsheet(document.getElementById('cheatsheet-encode'));
  document.getElementById('swatch-reveal').style.display = 'none';
  document.getElementById('submit-btn').style.display = 'inline-block';

  currentEncodeSeq = [];
  obs.word.split('').forEach((ch, i) => {
    MORSE[ch].split('').forEach(sym => currentEncodeSeq.push(sym));
    if (i < obs.word.length - 1) currentEncodeSeq.push('gap');
  });

  // reset cheat sheet to hidden each round
  document.getElementById('cheatsheet-encode').style.display = 'none';
  document.getElementById('cheatsheet-toggle-btn').textContent = 'Show Cheat Sheet';
  // reset target word to hidden each round

  document.getElementById('target-word').style.display = 'none';
  document.getElementById('window-focus-icon').style.display = 'block';
  document.getElementById('window-hint').style.display = 'block';
  document.getElementById('window-clickable').style.cursor = 'pointer';
  document.getElementById('window-clickable').onclick = revealTargetWord;


  playerSeq = [];
  renderEncodeGrid();
  updateMorseProgress();
  document.getElementById('submit-btn').disabled = true;
}

function renderEncodeGrid() {
  const grid = document.getElementById('encode-grid');
  grid.innerHTML = '';
  playerSeq.forEach(sym => {
    const el = document.createElement('div');
    if (sym === 'gap') {
      el.className = 'stitch gap';
    } else {
      el.className = 'stitch ' + (sym === '.' ? 'knit' : 'purl');
      el.textContent = sym === '.' ? '●' : '▬';
    }
    grid.appendChild(el);
  });
}

function updateMorseProgress() {
  document.getElementById('morse-progress').textContent =
    playerSeq.map(s => s === 'gap' ? ' / ' : s).join('');
}

function addStitch(type) {
  const sym = type === 'knit' ? '.' : (type === 'purl' ? '-' : 'gap');
  const expectedIndex = playerSeq.length;
  const correct = currentEncodeSeq[expectedIndex] === sym;

  playerSeq.push(sym);
  renderEncodeGrid();
  updateMorseProgress();

  if (!correct) {
    raiseSuspicion(15);
    const grid = document.getElementById('encode-grid');
    grid.classList.add('shake');
    setTimeout(() => grid.classList.remove('shake'), 300);
  }

  if (playerSeq.length >= currentEncodeSeq.length) {
    document.getElementById('submit-btn').disabled = false;
  }
}

function undoStitch() {
  if (playerSeq.length > 0) {
    playerSeq.pop();
    renderEncodeGrid();
    updateMorseProgress();
    document.getElementById('submit-btn').disabled = playerSeq.length < currentEncodeSeq.length;
  }
}

function raiseSuspicion(amount) {
  suspicion = Math.min(100, suspicion + amount);
  const fill = document.getElementById('meter-fill');
  fill.style.width = suspicion + '%';
  document.getElementById('suspicion-pct').textContent = suspicion + '%';
  fill.style.background = suspicion > 60 ? 'var(--suspicion-high)' :
                           suspicion > 30 ? '#b08a3e' : 'var(--suspicion-low)';
}

function submitRow() {
  const obs = OBSERVATIONS[currentSighting];
  document.getElementById('swatch-image').src = obs.image;
  document.getElementById('swatch-reveal').style.display = 'block';
  document.getElementById('submit-btn').style.display = 'none';
  window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
}

function proceedAfterRow() {
  currentSighting++;

  const npcChance = currentSighting >= 2 ? 0.55 : 0;
  const canInterrupt = currentSighting < OBSERVATIONS.length && Math.random() < npcChance;

  if (canInterrupt && !passengerInterruptionUsed) {
    passengerInterruptionUsed = true;
    goTo('npc');
    return;
  } else if (canInterrupt && !controllerInterruptionUsed) {
    controllerInterruptionUsed = true;
    goTo('controller');
    return;
  }

  if (suspicion >= 100) {
    goTo('caught');
    return;
  }
  if (currentSighting >= OBSERVATIONS.length) {
    finishMission();
  } else {
    buildMissionProgress();
    hornSound.currentTime = 0;
    hornSound.play();
    goTo('mission');
  }
}

function proceedAfterRow() {
  currentSighting++;
  if (suspicion >= 100) {
    goTo('caught');
    return;
  }
  if (currentSighting >= OBSERVATIONS.length) {
    finishMission();
  } else {
    buildMissionProgress();
    hornSound.currentTime = 0;
    hornSound.play();
    goTo('mission');
  }
}

/* ---------------- NPC SCENE ---------------- */
function npcChoice(choice) {
  let delta, title, text;

  if (choice === 'show') {
    delta = 15;
    title = 'Something Seemed Off';
    text = `"Hm. Unusual pattern, but I suppose every knitter has her own style." She studies the stitches a moment too long for comfort — but doesn't realize she's looking at code. Your suspicion rises slightly.`;
  } else if (choice === 'distract') {
    delta = 0;
    title = 'Just Small Talk';
    text = `"Yes, dreadful weather for travelling," she agrees, and turns back to her own window. A short, harmless exchange — she suspects nothing at all.`;
  } else if (choice === 'hide') {
    delta = 25;
    title = 'A Very Suspicious Reaction';
    text = `Her eyebrows rise as you tuck the work away. "I didn't realize knitting was a state secret," she says, half-joking — but she's still watching. Hiding something harmless is, itself, the giveaway. Your suspicion rises sharply.`;
  }

  raiseSuspicion(delta);
  document.getElementById('npc-result-title').textContent = title;
  document.getElementById('npc-result-text').textContent = text;
  goTo('npc-result');
}

function controllerChoice(choice) {
  let delta, title, text;

  if (choice === 'show') {
    delta = 15;
    title = 'A Professional Eye';
    text = `He turns the work over once, official and unhurried. "Tidy hands," he says, handing it back. He's trained to notice irregularities — and your pattern held, but only just. Your suspicion rises somewhat.`;
  } else if (choice === 'chat') {
    delta = 2;
    title = 'Routine and Unremarkable';
    text = `You keep your hands moving as you ask after the next station. He answers without much interest and moves on down the carriage. Ordinary behaviour from an ordinary passenger — barely a ripple.`;
  } else if (choice === 'hide') {
    delta = 35;
    title = 'An Official Takes Note';
    text = `Concealing something from a uniformed official is a different matter entirely than from a fellow passenger. He pauses, frowns, and makes a small note in his ledger before continuing on. Your suspicion rises sharply.`;
  }

  raiseSuspicion(delta);
  document.getElementById('npc-result-title').textContent = title;
  document.getElementById('npc-result-text').textContent = text;
  goTo('npc-result');
}

/* ---------------- END STATES ---------------- */
function finishMission() {
  document.getElementById('final-suspicion').textContent = suspicion + '%';
  document.getElementById('win-platform-ref').textContent =
    window.deliveryPlatform || 'your destination';
  goTo('win');
}

function restart() {
  suspicion = 0;
  currentSighting = 0;
  passengerInterruptionUsed = false;
  controllerInterruptionUsed = false;
  const fill = document.getElementById('meter-fill');
  fill.style.width = '0%';
  fill.style.background = 'var(--suspicion-low)';
  document.getElementById('suspicion-pct').textContent = '0%';
  setupTutorial();
  goTo('title');
}

/* ---------------- INIT ---------------- */
setupTutorial();