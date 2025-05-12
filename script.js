// === Theme Toggle ===
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
});

// === Game State Variables ===
let allBooks = [];
let acceptedTitles = [];
let boardData = null;
let attemptedAnswers = {};
let lockedCells = new Set();
let usedTitles = new Set();
let score = 0;
let guessesMade = 0;
let guessesLeft = 9;
let infiniteMode = true;
let hardcoreMode = false;

const patterns = {
  X: ["0-0", "1-1", "2-2", "0-2", "2-0"],
  H: ["0-0", "1-0", "2-0", "1-1", "0-2", "1-2", "2-2"]
};

// === Timer ===
let startTime = null;
function startTimer() {
  if (!startTime) startTime = new Date();
}
function getPlayDuration() {
  if (!startTime) return "00:00";
  const diff = new Date() - startTime;
  const m = Math.floor(diff / 60000).toString().padStart(2, "0");
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// === Load JSON Data ===
async function loadBookData() {
  const res = await fetch("books.json");
  allBooks = await res.json();
  acceptedTitles = allBooks.map(b => b.title.toLowerCase());
}

async function loadBoard(boardId) {
  const res = await fetch(`boards/${boardId}.json`);
  boardData = await res.json();

  const rows = document.querySelectorAll(".row-label");
  const cols = document.querySelectorAll(".col-label");

  boardData.categories.rows.forEach((r, i) => rows[i].textContent = r.label);
  boardData.categories.columns.forEach((c, i) => cols[i].textContent = c.label);
}

// === Utility ===
function capitalizeTitle(title) {
  const smallWords = ["a", "an", "and", "but", "or", "for", "nor", "the", "as", "at", "by", "from", "in", "into", "near", "of", "on", "onto", "to", "with"];
  return title.toLowerCase().split(" ").map((word, i) =>
    i === 0 || !smallWords.includes(word) ? word[0].toUpperCase() + word.slice(1) : word
  ).join(" ");
}

function showPopup(msg) {
  const popup = document.getElementById("popup-message");
  popup.textContent = msg;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 3000);
}

// === Grid Setup ===
function setupGrid() {
  document.querySelectorAll(".grid-box").forEach(box => {
    const input = box.querySelector(".cell-input");
    const dropdown = box.querySelector(".autocomplete");
    const cellKey = box.getAttribute("data-cell");
    let activeIndex = -1;

    box.addEventListener("click", () => input.focus());
    input.addEventListener("focus", () => input.select());

    input.addEventListener("input", () => {
      startTimer();
      const value = input.value.toLowerCase().trim();
      dropdown.innerHTML = "";
      activeIndex = -1;

      const isShort = acceptedTitles.some(t => t.length <= 4 && t === value);
      if (value.length >= (isShort ? 1 : 4)) {
        const matches = acceptedTitles.filter(t => t.includes(value)).slice(0, 5);
        matches.forEach(match => {
          const item = document.createElement("div");
          item.textContent = capitalizeTitle(match);
          item.classList.add("autocomplete-item");
          item.addEventListener("mousedown", (e) => {
            e.preventDefault();
            input.value = capitalizeTitle(match);
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
            const [r, c] = cellKey.split("-").map(Number);
            checkAnswer(match, r, c, input, box);
          });
          dropdown.appendChild(item);
        });
        dropdown.style.display = matches.length > 0 ? "block" : "none";
      } else {
        dropdown.style.display = "none";
      }
    });

    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (dropdown.style.display === "block" && items.length) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
          updateActive(items);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          updateActive(items);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0) {
            input.value = items[activeIndex].textContent;
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
          }
          const [r, c] = cellKey.split("-").map(Number);
          checkAnswer(input.value, r, c, input, box);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const [r, c] = cellKey.split("-").map(Number);
        checkAnswer(input.value, r, c, input, box);
      }
    });

    input.addEventListener("blur", () => setTimeout(() => dropdown.style.display = "none", 100));

    function updateActive(items) {
      items.forEach((item, i) => item.classList.toggle("active", i === activeIndex));
    }
  });

  // Mode Toggles
  document.getElementById("toggle-infinite").addEventListener("click", () => {
    infiniteMode = !infiniteMode;
    document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
    document.getElementById("toggle-infinite").textContent = `♾️ Infinite Mode: ${infiniteMode ? "On" : "Off"}`;
  });

  document.getElementById("toggle-hardcore").addEventListener("click", () => {
    if (guessesMade > 0) {
      showPopup("Hardcore Mode must be enabled before your first guess to earn the bonus.");
      return;
    }
    hardcoreMode = !hardcoreMode;
    document.getElementById("toggle-hardcore").textContent = `🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"}`;
  });
}

// === Answer Validation ===
function checkAnswer(inputTitle, row, col, input, box) {
  const guess = inputTitle.trim().toLowerCase();
  const cellKey = `${row}-${col}`;
  startTimer();
  guessesMade++;

  if (!acceptedTitles.includes(guess)) {
    showPopup(`⚠ "${capitalizeTitle(guess)}" is not in the accepted book list.`);
    input.value = "";
    return;
  }

  if (lockedCells.has(cellKey)) return;

  box.classList.remove("correct", "incorrect", "duplicate");

  if (usedTitles.has(guess)) {
    showPopup("⛔ Already used");
    box.classList.add("duplicate");
    input.value = "";
    return;
  }

  if (!attemptedAnswers[cellKey]) attemptedAnswers[cellKey] = [];
  if (attemptedAnswers[cellKey].includes(guess)) {
    showPopup("⛔ Already attempted");
    box.classList.add("duplicate");
    input.value = "";
    return;
  }

  attemptedAnswers[cellKey].push(guess);
  const accepted = boardData.answers[cellKey]?.map(a => a.toLowerCase()) || [];

  if (accepted.includes("[verify]")) {
    showPopup(`⚠ Not enough data for "${inputTitle}"`);
    return;
  }

  if (accepted.includes(guess)) {
    showPopup("✅ Correct!");
    lockCell(input, box, cellKey, guess, "correct");
  } else {
    showPopup("❌ Incorrect");
    if (!infiniteMode) {
      guessesLeft--;
      document.getElementById("guesses-left").textContent = guessesLeft;
    }
    score += 1;
    box.classList.add("incorrect");
    input.value = "";
  }
}

function lockCell(input, box, cellKey, guess, className) {
  input.disabled = true;
  input.style.opacity = 0.5;
  input.style.cursor = "not-allowed";
  box.classList.add(className);
  lockedCells.add(cellKey);
  usedTitles.add(guess);
}

// === End Game ===
function countGridThemes(titles) {
  const map = {};
  titles.forEach(title => {
    const b = allBooks.find(book => book.title.toLowerCase() === title);
    if (b?.gridThemes) {
      b.gridThemes.forEach(tag => map[tag] = (map[tag] || 0) + 1);
    }
  });
  return map;
}

function checkPatterns(correctCells) {
  return Object.entries(patterns).filter(([_, keys]) =>
    keys.every(k => correctCells.has(k))
  ).map(([k]) => k);
}

function endGame() {
  const correctTitles = [];
  const correctCells = new Set();

  document.querySelectorAll(".grid-box").forEach(box => {
    const input = box.querySelector(".cell-input");
    const cellKey = box.getAttribute("data-cell");
    if (lockedCells.has(cellKey)) {
      correctTitles.push(input.value.trim().toLowerCase());
      correctCells.add(cellKey);
    }
  });

  const wrong = guessesMade - correctTitles.length;
  const baseScore = correctTitles.length * 2 - wrong;
  let finalScore = baseScore;
  const multipliers = [];

  const patternMatches = checkPatterns(correctCells);
  if (patternMatches.includes("X")) finalScore += 3;
  if (patternMatches.includes("H")) finalScore += 3;

  const themeMap = countGridThemes(correctTitles);
  const declared = boardData.theme?.toLowerCase();
  if (themeMap[declared] >= 7) multipliers.push({ label: "Declared Theme", value: 1.25 });
  const secrets = Object.entries(themeMap).filter(([_, v]) => v === 9).map(([k]) => k);
  if (secrets.length > 0) multipliers.push({ label: "Secret Theme", value: 1.5 });
  if (hardcoreMode && wrong === 0) multipliers.push({ label: "Hardcore Mode", value: 1.5 });

  const totalMultiplier = multipliers.reduce((acc, m) => acc * m.value, 1);
  finalScore = Math.round(finalScore * totalMultiplier * 100) / 100;

  showResultsModal({
    time: getPlayDuration(),
    correct: correctTitles.length,
    wrong,
    baseScore,
    finalScore,
    patternsMatched: patternMatches,
    multipliers,
    matchedThemes: secrets
  });
}

// === Results Modal ===
function showResultsModal({ time, correct, wrong, baseScore, finalScore, patternsMatched, multipliers, matchedThemes }) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "results-modal";

  const content = document.createElement("div");
  content.className = "modal-content";

  const closeBtn = document.createElement("span");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => modal.remove());

  content.appendChild(closeBtn);
  content.innerHTML += `
    <h2>Game Summary</h2>
    <p><strong>Total Play Time:</strong> ${time}</p>
    <p><strong>Correct Answers:</strong> ${correct}</p>
    <p><strong>Wrong Answers:</strong> ${wrong}</p>
    <p><strong>Base Score:</strong> ${baseScore}</p>
    <h3>Bonuses Awarded</h3>
    <ul>
      ${patternsMatched.includes("X") ? "<li>X Marks the Spot! +3</li>" : ""}
      ${patternsMatched.includes("H") ? "<li>H for Heroism! +3</li>" : ""}
      ${multipliers.map(m => `<li>${m.label} Bonus ×${m.value}</li>`).join("")}
      ${matchedThemes.map(t => `<li>Secret Theme Unlocked: ${t}</li>`).join("")}
    </ul>
    <p><strong>Final Score:</strong> ${finalScore}</p>
  `;

  let best = localStorage.getItem("bestScore");
  if (!best || finalScore > parseFloat(best)) {
    best = finalScore;
    localStorage.setItem("bestScore", best);
  }
  content.innerHTML += `<p><strong>Your Best Score:</strong> ${best}</p>`;

  modal.appendChild(content);
  document.body.appendChild(modal);
}

// === Init on Load ===
window.addEventListener("DOMContentLoaded", async () => {
  await loadBookData();
  await loadBoard("board-001");
  setupGrid();
});