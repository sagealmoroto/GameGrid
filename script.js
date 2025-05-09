// === Theme Toggle ===
document.getElementById("theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  if (next === "light") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  localStorage.setItem("theme", next);
});

// === Popup Message ===
function showPopup(msg) {
  const popup = document.getElementById("popup-message");
  popup.textContent = msg;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 3000);
}

// === Utility Functions ===
function capitalizeTitle(title) {
  const lowercaseWords = ["a", "an", "and", "but", "or", "for", "nor", "the", "as", "at", "by", "from", "in", "into", "near", "of", "on", "onto", "to", "with"];
  return title
    .toLowerCase()
    .split(" ")
    .map((word, index) => (index === 0 || !lowercaseWords.includes(word)) 
      ? word.charAt(0).toUpperCase() + word.slice(1) 
      : word)
    .join(" ");
}

function getAuthorInitials(name) {
  return name.split(" ").map(w => w[0]).join("");
}

// === Game State ===
let allBooks = [];
let acceptedTitles = [];
let boardData = null;
let lockedCells = new Set();
let usedTitles = new Set();
let attemptedAnswers = {};
let guessesLeft = 9;
let score = 0;
let infiniteMode = true;
let hardcoreMode = false;
const availableBoards = ["board-001", "board-002", "board-003"];

// === Initialization ===
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  loadBooks();
  loadBoard("board-001");
  setupGrid();
  setupModals();
  setupButtons();
});

// === Load Books ===
async function loadBooks() {
  try {
    const res = await fetch("books.json");
    allBooks = await res.json();
    acceptedTitles = allBooks.map(b => b.title.toLowerCase());
  } catch (e) {
    console.error("Error loading books.json", e);
  }
}

// === Load Board JSON ===
async function loadBoard(id) {
  try {
    const res = await fetch(`boards/${id}.json`);
    boardData = await res.json();
    const rows = document.querySelectorAll(".row-label");
    const cols = document.querySelectorAll(".col-label");
    boardData.categories.rows.forEach((r, i) => rows[i].textContent = r.label);
    boardData.categories.columns.forEach((c, i) => cols[i].textContent = c.label);
    // Reset state
    document.querySelectorAll(".cell-input").forEach(i => {
      i.value = "";
      i.disabled = false;
      i.style.opacity = 1;
      i.style.cursor = "text";
    });
    document.querySelectorAll(".grid-box").forEach(b => {
      b.classList.remove("correct", "incorrect", "duplicate");
    });
    lockedCells.clear();
    usedTitles.clear();
    attemptedAnswers = {};
    score = 0;
    guessesLeft = 9;
    document.getElementById("current-score").textContent = score;
    document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
  } catch (e) {
    console.error("Error loading board", e);
  }
}

// === Setup Modals ===
function setupModals() {
  document.getElementById("help-btn").addEventListener("click", () => {
    document.getElementById("how-to-play").classList.remove("hidden");
  });

  document.querySelectorAll(".close-btn").forEach(btn => {
    const targetId = btn.getAttribute("data-modal");
    btn.addEventListener("click", () => {
      document.getElementById(targetId).classList.add("hidden");
    });
  });

  document.getElementById("view-archive").addEventListener("click", () => {
    const list = document.getElementById("past-board-list");
    list.innerHTML = "";
    availableBoards.forEach((id, i) => {
      const li = document.createElement("li");
      li.textContent = `#${String(i + 1).padStart(3, "0")}`;
      li.addEventListener("click", () => {
        loadBoard(id);
        document.getElementById("past-boards-modal").classList.add("hidden");
      });
      list.appendChild(li);
    });
    document.getElementById("past-boards-modal").classList.remove("hidden");
  });

  document.getElementById("view-answers").addEventListener("click", () => {
    renderMasterList();
    document.getElementById("accepted-answers-modal").classList.remove("hidden");
  });
}

function renderMasterList() {
  const container = document.getElementById("master-book-list");
  container.innerHTML = "";
  const sorted = [...allBooks].sort((a, b) => a.title.localeCompare(b.title));
  sorted.forEach(book => {
    const p = document.createElement("p");
    p.textContent = `${book.title} (${getAuthorInitials(book.author)})`;
    container.appendChild(p);
  });
}

// === Setup Buttons ===
function setupButtons() {
  document.getElementById("toggle-infinite").addEventListener("click", () => {
    infiniteMode = !infiniteMode;
    document.getElementById("toggle-infinite").textContent = `♾️ Infinite Mode: ${infiniteMode ? "On" : "Off"}`;
    document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
  });

  document.getElementById("toggle-hardcore").addEventListener("click", () => {
    hardcoreMode = !hardcoreMode;
    document.getElementById("toggle-hardcore").textContent = `🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"}`;
  });

  document.getElementById("random-board").addEventListener("click", () => {
    const choice = availableBoards[Math.floor(Math.random() * availableBoards.length)];
    loadBoard(choice);
  });
}

// === Grid Input Behavior ===
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

      const isShort = acceptedTitles.some(t => t.length <= 4 && t === value);
      const minLength = isShort ? 1 : 4;
      if (value.length < minLength) {
        dropdown.style.display = "none";
        return;
      }

      const matches = acceptedTitles.filter(t => t.includes(value)).slice(0, 5);
      if (matches.length === 0) {
        dropdown.style.display = "none";
        return;
      }

      matches.forEach((match, i) => {
        const item = document.createElement("div");
        item.textContent = capitalizeTitle(match);
        item.classList.add("autocomplete-item");
        item.addEventListener("mousedown", (e) => {
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
    });

    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");

      if (dropdown.style.display === "block" && items.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
          items.forEach((item, i) => item.classList.toggle("active", i === activeIndex));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
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
}

// === Check Answer Logic ===
function checkAnswer(title, row, col, input, box) {
  const guess = title.trim().toLowerCase();
  const cellKey = `${row}-${col}`;

  if (!acceptedTitles.includes(guess)) {
    showPopup(`⚠ "${capitalizeTitle(guess)}" is not in the accepted list.`);
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

  if (!boardData || !boardData.answers[cellKey]) {
    showPopup("⚠ Undefined cell.");
    return;
  }

  const answers = boardData.answers[cellKey].map(a => a.toLowerCase());
  if (answers.includes("[verify]")) {
    showPopup(`⚠ Not enough data for "${capitalizeTitle(guess)}"`);
    return;
  }

  if (answers.includes(guess)) {
    showPopup("✅ Correct!");
    lockCell(input, box, cellKey, guess, "correct");
  } else {
    showPopup("❌ Incorrect");
    score++;
    document.getElementById("current-score").textContent = score;

    if (!infiniteMode) {
      guessesLeft--;
      document.getElementById("guesses-left").textContent = guessesLeft;
    }

    if (hardcoreMode) {
      lockCell(input, box, cellKey, guess, "incorrect");
    } else {
      box.classList.add("incorrect");
      input.value = "";
    }
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
