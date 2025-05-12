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

// === Utility ===
function showPopup(msg) {
  const popup = document.getElementById("popup-message");
  popup.textContent = msg;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 3000);
}

function capitalizeTitle(title) {
  const lower = ["a", "an", "and", "but", "or", "for", "nor", "the", "as", "at", "by", "from", "in", "into", "near", "of", "on", "onto", "to", "with"];
  return title
    .toLowerCase()
    .split(" ")
    .map((word, i) => (i === 0 || !lower.includes(word) ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function getAuthorInitials(author) {
  return author.split(" ").map(w => w[0]).join("");
}

// === Game Data ===
let allBooks = [];
let acceptedTitles = [];
let boardData = null;
let lockedCells = new Set();
let usedTitles = new Set();
let attemptedAnswers = {};
let score = 0;
let guessesLeft = 9;
let infiniteMode = true;
let hardcoreMode = false;
let firstGuessMade = false;
let startTime;
let endTime;
const availableBoards = ["board-001", "board-002", "board-003"];

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  setupModals();
  loadBookData();
  loadBoard("board-001");
  setupGrid();
  startTime = Date.now();
});

// === Load Books ===
async function loadBookData() {
  try {
    const res = await fetch("books.json");
    allBooks = await res.json();
    acceptedTitles = allBooks.map(b => b.title.toLowerCase());
  } catch (err) {
    console.error("Error loading books:", err);
  }
}

// === Load Board ===
async function loadBoard(id) {
  try {
    const res = await fetch(`boards/${id}.json`);
    boardData = await res.json();

    const rows = document.querySelectorAll(".row-label");
    const cols = document.querySelectorAll(".col-label");
    boardData.categories.rows.forEach((cat, i) => (rows[i].textContent = cat.label));
    boardData.categories.columns.forEach((cat, i) => (cols[i].textContent = cat.label));
  } catch (err) {
    console.error("Board error:", err);
  }
}

// === Modals & Buttons ===
function setupModals() {
  document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").classList.add("hidden");
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

  document.getElementById("end-game").addEventListener("click", () => {
    endTime = Date.now();
    showResultsModal();
  });
}

function renderMasterList() {
  const container = document.getElementById("accepted-answers-modal");
  const existing = document.getElementById("master-book-list");
  if (existing) existing.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "master-book-list";
  wrapper.style.columns = "2";
  wrapper.style.marginTop = "1rem";

  const header = document.createElement("h3");
  header.textContent = "Master List";
  wrapper.appendChild(header);

  const sorted = [...allBooks].sort((a, b) => a.title.localeCompare(b.title));
  sorted.forEach(book => {
    const p = document.createElement("p");
    p.textContent = `${book.title} (${getAuthorInitials(book.author)})`;
    wrapper.appendChild(p);
  });

  container.querySelector(".modal-content").appendChild(wrapper);
}

// === Grid Logic ===
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

      const matches = acceptedTitles.filter(t => t.includes(value)).slice(0, 5);
      if (value.length >= 4 && matches.length > 0) {
        matches.forEach((match, i) => {
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
    });

    input.addEventListener("keydown", e => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (dropdown.style.display === "block" && items.length > 0) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = (e.key === "ArrowDown") ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
          items.forEach((item, i) => item.classList.toggle("active", i === activeIndex));
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
  });

  document.getElementById("toggle-infinite").addEventListener("click", () => {
    infiniteMode = !infiniteMode;
    document.getElementById("toggle-infinite").textContent = `♾️ Infinite Mode: ${infiniteMode ? "On" : "Off"}`;
    document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
  });

  document.getElementById("toggle-hardcore").addEventListener("click", () => {
    if (firstGuessMade) {
      showPopup("⚠️ Enable Hardcore Mode before first guess to earn bonus.");
      return;
    }
    hardcoreMode = !hardcoreMode;
    document.getElementById("toggle-hardcore").textContent = `🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"}`;
  });
}

// === Answer Logic ===
function checkAnswer(inputTitle, row, col, inputEl, boxEl) {
  const guess = inputTitle.trim().toLowerCase();
  const cellKey = `${row}-${col}`;

  if (!firstGuessMade) firstGuessMade = true;
  if (!acceptedTitles.includes(guess)) {
    showPopup(`⚠ "${capitalizeTitle(guess)}" is not in the accepted book list.`);
    inputEl.value = "";
    return;
  }

  if (lockedCells.has(cellKey)) return;
  boxEl.classList.remove("duplicate", "incorrect", "correct");

  if (usedTitles.has(guess)) {
    showPopup("⛔ Already used");
    boxEl.classList.add("duplicate");
    inputEl.value = "";
    return;
  }

  if (!attemptedAnswers[cellKey]) attemptedAnswers[cellKey] = [];

  if (attemptedAnswers[cellKey].includes(guess)) {
    showPopup("⛔ Already attempted");
    boxEl.classList.add("duplicate");
    inputEl.value = "";
    return;
  }

  attemptedAnswers[cellKey].push(guess);
  const accepted = (boardData.answers[cellKey] || []).map(a => a.toLowerCase());

  if (accepted.includes("[verify]")) {
    showPopup(`⚠ Not enough data for "${inputTitle}"`);
    return;
  }

  if (accepted.includes(guess)) {
    showPopup("✅ Correct!");
    lockCell(inputEl, boxEl, cellKey, guess, "correct");
  } else {
    showPopup("❌ Incorrect");
    score += 1;
    document.getElementById("current-score").textContent = score;

    if (!infiniteMode) {
      guessesLeft--;
      document.getElementById("guesses-left").textContent = guessesLeft;
    }

    if (hardcoreMode) {
      lockCell(inputEl, boxEl, cellKey, guess, "incorrect");
    } else {
      boxEl.classList.add("incorrect");
      inputEl.value = "";
    }
  }

  if (lockedCells.size === 9) {
    endTime = Date.now();
    showResultsModal();
  }
}

function lockCell(input, box, key, guess, className) {
  input.disabled = true;
  input.style.opacity = 0.5;
  input.style.cursor = "not-allowed";
  box.classList.add(className);
  lockedCells.add(key);
  usedTitles.add(guess);
}

// === Results ===
function showResultsModal() {
  const modal = document.getElementById("results-modal");
  const timePlayed = ((endTime - startTime) / 1000).toFixed(2);
  const scoreEl = document.getElementById("results-score");
  const timeEl = document.getElementById("results-time");
  const bonusEl = document.getElementById("results-bonuses");

  scoreEl.textContent = `Final Score: ${score}`;
  timeEl.textContent = `Total Time: ${timePlayed} seconds`;

  const bonuses = [];

  if (hardcoreMode) bonuses.push("Hardcore Mode Bonus x1.5");
  if (lockedCells.has("0-0") && lockedCells.has("1-1") && lockedCells.has("2-2") && lockedCells.has("0-2") && lockedCells.has("2-0"))
    bonuses.push("X Marks the Spot! +3");

  bonusEl.innerHTML = bonuses.map(b => `<li>${b}</li>`).join("");
  modal.classList.remove("hidden");
}