// CLEANED, FIXED, AND CONSOLIDATED BONUS LOGIC

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

// === Popup Message ===
function showPopup(msg) {
  const popup = document.getElementById("popup-message");
  popup.textContent = msg;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 3000);
}

// === Answer Evaluation ===
function checkAnswer(inputTitle, rowIndex, colIndex, inputElement, boxElement) {
  const guess = inputTitle.trim().toLowerCase();
  const cellKey = `${rowIndex}-${colIndex}`;

  if (!acceptedTitles.includes(guess)) {
    showPopup(`⚠ "${capitalizeTitle(guess)}" is not in the accepted book list.`);
    inputElement.value = "";
    return;
  }

  if (lockedCells.has(cellKey)) return;

  boxElement.classList.remove("duplicate", "incorrect", "correct");

  if (usedTitles.has(guess)) {
    showPopup("⛔ Already used");
    boxElement.classList.add("duplicate");
    inputElement.value = "";
    return;
  }

  if (!attemptedAnswers[cellKey]) attemptedAnswers[cellKey] = [];

  if (attemptedAnswers[cellKey].includes(guess)) {
    showPopup("⛔ Already attempted");
    boxElement.classList.add("duplicate");
    inputElement.value = "";
    return;
  }

  attemptedAnswers[cellKey].push(guess);
  const validAnswers = boardData.answers[cellKey].map(a => a.toLowerCase());

  if (validAnswers.includes("[verify]")) {
    showPopup(`⚠ Not enough data for "${inputTitle}"`);
    inputElement.value = "";
    return;
  }

  if (validAnswers.includes(guess)) {
    showPopup("✅ Correct!");
    lockCell(inputElement, boxElement, cellKey, guess, "correct");
    checkGameCompletion();
  } else {
    showPopup("❌ Incorrect");
    score += 1;
    document.getElementById("current-score").textContent = score;

    if (!infiniteMode) {
      guessesLeft -= 1;
      document.getElementById("guesses-left").textContent = guessesLeft;
    }

    if (hardcoreMode) {
      lockCell(inputElement, boxElement, cellKey, guess, "incorrect");
    } else {
      boxElement.classList.add("incorrect");
      inputElement.value = "";
    }
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

function checkGameCompletion() {
  if (lockedCells.size === 9) {
    endGame();
  }
}

// === Utility Functions ===
function capitalizeTitle(title) {
  const lowercaseWords = [
    "a", "an", "and", "but", "or", "for", "nor", "the",
    "as", "at", "by", "from", "in", "into", "near", "of",
    "on", "onto", "to", "with"
  ];
  return title
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        return word;
      }
    })
    .join(" ");
}

function resetGameState() {
  attemptedAnswers = {};
  lockedCells.clear();
  usedTitles.clear();
  score = 0;
  guessesLeft = 9;
  hardcoreMode = localStorage.getItem("hardcorePreLock") === "true";
  document.getElementById("current-score").textContent = score;
  document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
  document.getElementById("toggle-hardcore").textContent = `🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"}`;
}

// === Data & State ===
let allBooks = [];
let acceptedTitles = [];
let boardData = null;
let attemptedAnswers = {};
let lockedCells = new Set();
let usedTitles = new Set();
let score = 0;
let guessesLeft = 9;
let infiniteMode = true;
let hardcoreMode = false;
let gameStartTime = null;
let boardId = "board-001";
const availableBoards = ["board-001", "board-002", "board-003"];

// === Bonus Definitions ===
const bonusDefinitions = {}; // all bonuses now declared in one place (to be populated below)

// === Bonus Definitions (Visible + Hidden + Combo) ===
Object.assign(bonusDefinitions, {
  // 🔓 Combo Bonuses
  comboVaultCracker: { icon: "🔒", label: "Vault Cracker", desc: "Completed Hardcore + Secret Theme", visible: false, points: 5 },
  comboFlashReader: { icon: "⚡", label: "Flash Reader", desc: "Completed in under 90s with all correct", visible: false, points: 5 },
  comboArchitect: { icon: "📐", label: "Architect", desc: "Completed X + H + Methodical", visible: false, multiplier: 1.5 },

  // 🏆 Visible Bonuses
  patternX: { icon: "🔢", label: "Pattern Seeker", desc: "Completed an X pattern", visible: true, points: 3 },
  patternH: { icon: "🪞", label: "Symmetry Master", desc: "Completed an H pattern", visible: true, points: 5 },
  methodical: { icon: "🧾", label: "Methodical", desc: "Completed left-to-right, top-to-bottom", visible: true, points: 10 },
  themeMatch: { icon: "🎨", label: "Thematic Soul", desc: "7–8 answers match declared theme", visible: true, multiplier: 1.25 },
  fullTheme: { icon: "🧠", label: "Full Theme", desc: "All 9 answers match declared theme", visible: true, multiplier: 1.5 },
  secretTheme: { icon: "🕵️", label: "Secret Whisperer", desc: "All 9 answers match hidden theme", visible: true, multiplier: 1.25 },
  perfectNine: { icon: "🏅", label: "Perfect 9", desc: "All answers correct", visible: true, points: 10 },
  hardcore: { icon: "💀", label: "Iron Reader", desc: "Played in Hardcore Mode", visible: true, multiplier: 2.0 },

  // 🎁 Hidden Bonuses
  speedDemon: { icon: "⏱️", label: "Speed Demon", desc: "Finished in under 90 seconds", visible: false, points: 7 },
  firstEdition: { icon: "📘", label: "First Edition", desc: "No retries for any tile", visible: false, points: 10 },
  deepCut: { icon: "🧠", label: "Deep Cut", desc: "Used a book with 1 or fewer tags", visible: false, points: 3 },
  gothicGlutton: { icon: "🦇", label: "Gothic Glutton", desc: "Used 3+ Gothic Fiction books", visible: false, points: 4 },
  genreJuggler: { icon: "🎭", label: "Genre Juggler", desc: "All 9 books have different genres", visible: false, points: 6 },
  bannedAndBrave: { icon: "🚫📖", label: "Banned & Brave", desc: "Used 2+ banned books", visible: false, points: 5 },
  witchyWisdom: { icon: "🔮", label: "Witchy Wisdom", desc: "Used 2+ books tagged with mythology or magic", visible: false, points: 3 },
  fixerUpper: { icon: "🧱", label: "Fixer Upper", desc: "Corrected 3+ tiles after initial wrong guesses", visible: false, points: 4 },
  twinning: { icon: "👯", label: "Twinning", desc: "Two correct books share the exact same title", visible: false, points: 2 },
  authorStreak: { icon: "✍️", label: "Author Streak", desc: "Used 3+ books by the same author", visible: false, points: 3 },
  diverseVoices: { icon: "🌍", label: "Diverse Voices", desc: "3+ authors of color", visible: false, points: 5 },
  translatedTreasures: { icon: "🌐", label: "Translated Treasures", desc: "3+ works in translation", visible: false, points: 3 },
  debutHunter: { icon: "🌱", label: "Debut Hunter", desc: "3 debut novels used", visible: false, points: 4 },
  backlistBoss: { icon: "📚", label: "Backlist Boss", desc: "All books published before 1970", visible: false, points: 6 },
  tagStacker: { icon: "🏷️", label: "Tag Stacker", desc: "One book fulfills 5+ tags", visible: false, points: 5 },
  wildcard: { icon: "🃏", label: "Wildcard", desc: "Book fits row, column, and declared theme", visible: false, points: 5 }
});
// === Bonus Detection Logic (Full Replacements for detectBonus) ===
function detectBonus(key, bonus, elapsed) {
  const correctTitles = Object.entries(attemptedAnswers)
    .filter(([k, arr]) => lockedCells.has(k))
    .map(([_, arr]) => arr[arr.length - 1].toLowerCase());
  const matchedBooks = allBooks.filter(b => correctTitles.includes(b.title.toLowerCase()));

  if (key === "hardcore") return hardcoreMode;
  if (key === "speedDemon") return parseFloat(elapsed) < 90;
  if (key === "firstEdition") return Object.values(attemptedAnswers).every(arr => arr.length === 1);
  if (key === "perfectNine") return lockedCells.size === 9 && Object.values(attemptedAnswers).every(arr => arr.length === 1);

  if (key === "patternX") return ["0-0","0-2","1-1","2-0","2-2"].every(c => lockedCells.has(c));
  if (key === "patternH") return ["0-0","0-2","1-0","1-1","1-2","2-0","2-2"].every(c => lockedCells.has(c));
  if (key === "methodical") {
    const expectedOrder = ["0-0","0-1","0-2","1-0","1-1","1-2","2-0","2-1","2-2"];
    const actualOrder = Object.keys(attemptedAnswers);
    return actualOrder.length === 9 && expectedOrder.every((k, i) => actualOrder[i] === k);
  }

  if (key === "themeMatch" && boardData.theme) {
    const theme = boardData.theme.toLowerCase();
    const count = matchedBooks.filter(b => [...(b.themes||[]), ...(b.genre||[]), ...(b.literary_movement||[])]
      .some(t => t.toLowerCase() === theme)).length;
    return count >= 7 && count <= 8;
  }

  if (key === "fullTheme" && boardData.theme) {
    const theme = boardData.theme.toLowerCase();
    return matchedBooks.length === 9 && matchedBooks.every(b => [...(b.themes||[]), ...(b.genre||[]), ...(b.literary_movement||[])]
      .some(t => t.toLowerCase() === theme));
  }

  if (key === "secretTheme") {
    const tagFields = ["themes", "genre", "literary_movement"];
    const tagCounts = {};
    matchedBooks.forEach(b => {
      tagFields.forEach(f => (b[f]||[]).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }));
    });
    return Object.values(tagCounts).some(count => count === 9);
  }

  if (key === "deepCut") return matchedBooks.some(b => ((b.themes?.length||0)+(b.genre?.length||0)+(b.literary_movement?.length||0)) <= 1);
  if (key === "gothicGlutton") return matchedBooks.filter(b => (b.genre||[]).includes("Gothic Fiction")).length >= 3;
  if (key === "genreJuggler") {
    const genres = new Set();
    matchedBooks.forEach(b => (b.genre||[]).forEach(g => genres.add(g)));
    return genres.size >= 9;
  }
  if (key === "bannedAndBrave") return matchedBooks.filter(b => b.controversy_or_banned).length >= 2;
  if (key === "witchyWisdom") return matchedBooks.filter(b => (b.themes||[]).some(t => ["magic","mythology"].includes(t.toLowerCase()))).length >= 2;
  if (key === "fixerUpper") return Object.values(attemptedAnswers).filter(arr => arr.length > 1).length >= 3;
  if (key === "twinning") {
    const counts = {};
    correctTitles.forEach(t => counts[t] = (counts[t] || 0) + 1);
    return Object.values(counts).some(c => c > 1);
  }
  if (key === "authorStreak") {
    const authorMap = {};
    matchedBooks.forEach(b => authorMap[b.author] = (authorMap[b.author] || 0) + 1);
    return Object.values(authorMap).some(c => c >= 3);
  }
  if (key === "diverseVoices") return matchedBooks.filter(b => b.author_of_color).length >= 3;
  if (key === "translatedTreasures") return matchedBooks.filter(b => b.translated).length >= 3;
  if (key === "debutHunter") return matchedBooks.filter(b => b.debut).length >= 3;
  if (key === "backlistBoss") return matchedBooks.length === 9 && matchedBooks.every(b => b.year_published < 1970);
  if (key === "tagStacker") return matchedBooks.some(b => ((b.themes?.length||0)+(b.genre?.length||0)+(b.literary_movement?.length||0)) >= 5);

  // Wildcard not yet implemented
  return false;
}

// === endGame() — Scoring, Detection, and Rendering ===
function endGame() {
  const endTime = Date.now();
  const elapsed = ((endTime - gameStartTime) / 1000).toFixed(2);
  const modal = document.getElementById("results-modal");
  const container = document.getElementById("results-breakdown");

  container.innerHTML = `
    <h2>📚 Game Results</h2>
    <p><strong>Final Score:</strong> ${score} points</p>
    <p><strong>Total Time:</strong> ${elapsed} seconds</p>
    <h3>🏆 Achievements Unlocked</h3>
    <ul id="achievements-list"></ul>
    <div id="hidden-bonuses-section" class="hidden">
      <h3>🎁 Hidden Bonuses</h3>
      <ul id="hidden-bonuses-list"></ul>
    </div>
    <h3>📈 Score Summary</h3>
    <ul id="score-summary-list"></ul>
  `;

  modal.classList.remove("hidden");

  const earnedBonuses = [];
  const earnedHiddenBonuses = [];
  let flatBonusPoints = 0;
  let multiplier = 1;

  // DETECT ALL BONUSES
  Object.entries(bonusDefinitions).forEach(([key, bonus]) => {
    let earned = false;
    try {
      earned = detectBonus(key, bonus, elapsed);
    } catch (err) {
      console.warn(`Error evaluating bonus '${key}':`, err);
    }
    if (earned) {
      if (bonus.visible) {
        earnedBonuses.push(bonus);
      } else {
        earnedHiddenBonuses.push(bonus);
      }
      if (bonus.points) flatBonusPoints += bonus.points;
      if (bonus.multiplier) multiplier *= bonus.multiplier;
    }
  });

  // EVALUATE COMBOS
  const comboEarned = [];
  const has = label => [...earnedBonuses, ...earnedHiddenBonuses].some(b => b.label === label);
  if (has("Iron Reader") && has("Secret Whisperer")) comboEarned.push("comboVaultCracker");
  if (has("Speed Demon") && has("Perfect 9")) comboEarned.push("comboFlashReader");
  if (has("Pattern Seeker") && has("Symmetry Master") && has("Methodical")) comboEarned.push("comboArchitect");

  comboEarned.forEach(key => {
    const bonus = bonusDefinitions[key];
    earnedHiddenBonuses.push(bonus);
    if (bonus.points) flatBonusPoints += bonus.points;
    if (bonus.multiplier) multiplier *= bonus.multiplier;
  });

  // RENDER RESULTS
  const achievementList = document.getElementById("achievements-list");
  earnedBonuses.forEach(b => {
    const li = document.createElement("li");
    li.innerHTML = `${b.icon} <strong>${b.label}</strong>`;
    li.title = b.desc;
    achievementList.appendChild(li);
  });

  if (earnedHiddenBonuses.length > 0) {
    const hiddenSection = document.getElementById("hidden-bonuses-section");
    hiddenSection.classList.remove("hidden");
    const hiddenList = document.getElementById("hidden-bonuses-list");
    earnedHiddenBonuses.forEach(b => {
      const li = document.createElement("li");
      li.innerHTML = `${b.icon} <strong>${b.label}</strong>`;
      li.title = b.desc;
      hiddenList.appendChild(li);
    });
  }

  const scoreSummary = document.getElementById("score-summary-list");
  scoreSummary.innerHTML = `
    <li>🧮 Base Score: ${score}</li>
    <li>🎯 Bonus Points: +${flatBonusPoints}</li>
    <li>📊 Multiplier: ×${multiplier}</li>
    <li>🏁 Final Score: ${(Math.round((score + flatBonusPoints) * multiplier))}</li>
  `;
}

// Helper: Detect if bonus was earned
function detectBonus(key, bonus, elapsed) {
  // This stub will be replaced with full logic if needed
  return false; // to be replaced
}
// === Remaining JS Setup (Modals, Grid, Data Loading) ===

// === Load Books JSON ===
async function loadBookData() {
  try {
    const response = await fetch("books.json");
    allBooks = await response.json();
    acceptedTitles = allBooks.map(book => book.title.toLowerCase());
  } catch (err) {
    console.error("Error loading books.json:", err);
  }
}

// === Load Board JSON ===
async function loadBoard(id) {
  boardId = id;
  try {
    const response = await fetch(`boards/${id}.json`);
    boardData = await response.json();
    document.querySelectorAll(".row-label").forEach((el, i) => {
      el.textContent = boardData.categories.rows[i].label;
    });
    document.querySelectorAll(".col-label").forEach((el, i) => {
      el.textContent = boardData.categories.columns[i].label;
    });
    resetGameState();
    document.querySelectorAll(".cell-input").forEach(input => {
      input.disabled = false;
      input.value = "";
      input.style.opacity = 1;
      input.style.cursor = "text";
    });
    document.querySelectorAll(".grid-box").forEach(box => {
      box.classList.remove("correct", "incorrect", "duplicate");
    });
    gameStartTime = Date.now();
  } catch (err) {
    console.error("Error loading board:", err);
  }
}

// === Setup Modals ===
function setupModals() {
  document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-modal") || btn.closest(".modal").id;
      document.getElementById(target).classList.add("hidden");
    });
  });
  document.getElementById("help-btn").addEventListener("click", () => {
    document.getElementById("how-to-play").classList.remove("hidden");
  });
  document.getElementById("view-archive").addEventListener("click", () => {
    const list = document.getElementById("past-board-list");
    list.innerHTML = "";
    availableBoards.forEach((id, index) => {
      const li = document.createElement("li");
      li.textContent = `#${String(index + 1).padStart(3, "0")}`;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        document.getElementById("past-boards-modal").classList.add("hidden");
        loadBoard(id);
      });
      list.appendChild(li);
    });
    document.getElementById("past-boards-modal").classList.remove("hidden");
  });
  document.getElementById("view-answers").addEventListener("click", () => {
    document.getElementById("accepted-answers-modal").classList.remove("hidden");
    renderMasterList();
  });
  document.getElementById("end-game-btn")?.addEventListener("click", () => {
    endGame();
  });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
    }
  });
}

// === Setup Grid and Buttons ===
function setupGrid() {
  document.querySelectorAll(".grid-box").forEach(box => {
    const input = box.querySelector(".cell-input");
    const dropdown = box.querySelector(".autocomplete");
    const cellKey = box.getAttribute("data-cell");
    let activeIndex = -1;

    box.addEventListener("click", () => input.focus());
    input.addEventListener("focus", () => input.select());

    input.addEventListener("input", () => {
      const value = input.value.toLowerCase().trim();
      dropdown.innerHTML = "";
      activeIndex = -1;

      const isShort = acceptedTitles.some(title => title.length <= 4 && title === value);
      const minLen = isShort ? 1 : 4;

      if (value.length >= minLen) {
        const matches = acceptedTitles.filter(title => title.includes(value)).slice(0, 5);
        if (matches.length > 0) {
          matches.forEach(match => {
            const item = document.createElement("div");
            item.textContent = capitalizeTitle(match);
            item.classList.add("autocomplete-item");
            item.addEventListener("mousedown", e => {
              e.preventDefault();
              input.value = capitalizeTitle(match);
              dropdown.innerHTML = "";
              dropdown.style.display = "none";
              const [row, col] = cellKey.split("-").map(Number);
              checkAnswer(match, row, col, input, box);
            });
            dropdown.appendChild(item);
          });
          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      }
    });

    input.addEventListener("keydown", e => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (dropdown.style.display === "block" && items.length > 0) {
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
          if (activeIndex >= 0 && items[activeIndex]) {
            input.value = items[activeIndex].textContent;
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
          }
          const [row, col] = cellKey.split("-").map(Number);
          checkAnswer(input.value, row, col, input, box);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const [row, col] = cellKey.split("-").map(Number);
        checkAnswer(input.value, row, col, input, box);
      }
    });

    input.addEventListener("blur", () => setTimeout(() => dropdown.style.display = "none", 100));

    function updateActive(items) {
      items.forEach((item, i) => item.classList.toggle("active", i === activeIndex));
    }
  });

  document.getElementById("toggle-infinite").addEventListener("click", () => {
    infiniteMode = !infiniteMode;
    document.getElementById("toggle-infinite").textContent = `♾️ Infinite Mode: ${infiniteMode ? "On" : "Off"}`;
    document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
  });

  document.getElementById("toggle-hardcore").addEventListener("click", () => {
    if (Object.keys(attemptedAnswers).length > 0) {
      showPopup("Hardcore Mode must be selected before your first guess.");
      return;
    }
    hardcoreMode = !hardcoreMode;
    localStorage.setItem("hardcorePreLock", hardcoreMode);
    document.getElementById("toggle-hardcore").textContent = `🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"}`;
  });
}

// === Init on Load ===
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  loadBookData();
  loadBoard(boardId);
  setupModals();
  gameStartTime = Date.now();
});
