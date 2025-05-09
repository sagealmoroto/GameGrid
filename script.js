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

// === Data & State ===
let allBooks = [];
let acceptedTitles = [];
let boardData = null;
let attemptedAnswers = {}; // { "0-0": ["the hobbit"] }
let lockedCells = new Set();
let usedTitles = new Set();

let score = 0;
let guessesLeft = 9;
let infiniteMode = true;
let hardcoreMode = false;

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  loadBookData();
  loadBoardFromDate();
  setupGrid();
});

// === Modal Logic ===
const modal = document.getElementById("how-to-play");
const helpBtn = document.getElementById("help-btn");
const closeBtn = document.querySelector(".close-btn");

window.addEventListener("load", () => modal.classList.remove("hidden"));
helpBtn.addEventListener("click", () => modal.classList.remove("hidden"));
closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

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
async function loadBoardFromDate() {
  try {
    const response = await fetch("boards/board-001.json");
    boardData = await response.json();

    const rowLabels = document.querySelectorAll(".row-label");
    const colLabels = document.querySelectorAll(".col-label");

    boardData.categories.rows.forEach((cat, i) => {
      rowLabels[i].textContent = cat.label;
    });
    boardData.categories.columns.forEach((cat, i) => {
      colLabels[i].textContent = cat.label;
    });
  } catch (err) {
    console.error("Error loading board:", err);
  }
}

// === Grid Setup ===
function setupGrid() {
  const boxes = document.querySelectorAll(".grid-box");

  boxes.forEach(box => {
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

      const isShortTitle = acceptedTitles.some(title => title.length <= 4 && title === value);
      const minLength = isShortTitle ? 1 : 4;

      if (value.length >= minLength) {
        const matches = acceptedTitles
          .filter(title => title.includes(value))
          .slice(0, 5);

        if (matches.length > 0) {
          matches.forEach((match, index) => {
            const item = document.createElement("div");
            item.textContent = match;
            item.classList.add("autocomplete-item");

            item.addEventListener("click", () => {
              input.value = match;
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
      } else {
        dropdown.style.display = "none";
      }
    });

    input.addEventListener("keydown", (e) => {
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

    input.addEventListener("blur", () => {
      setTimeout(() => dropdown.style.display = "none", 100);
    });

    function updateActive(items) {
      items.forEach((item, i) => {
        item.classList.toggle("active", i === activeIndex);
      });
    }
  });

  // === Infinite Mode Toggle ===
  const toggleButton = document.getElementById("toggle-infinite");
  toggleButton.addEventListener("click", () => {
    infiniteMode = !infiniteMode;
    toggleButton.textContent = `\u267e\ufe0f Infinite Mode: ${infiniteMode ? "On" : "Off"}`;
    document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
  });

  // === Hardcore Mode Toggle ===
  const hardcoreBtn = document.getElementById("toggle-hardcore");
  hardcoreBtn.addEventListener("click", () => {
    hardcoreMode = !hardcoreMode;
    hardcoreBtn.textContent = `🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"}`;
  });

  // Set initial display for infinite mode
  document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
}

// === Answer Validation ===
function checkAnswer(inputTitle, rowIndex, colIndex, inputElement, boxElement) {
  const guess = inputTitle.trim().toLowerCase();
  const cellKey = `${rowIndex}-${colIndex}`;

  if (lockedCells.has(cellKey)) return;
  if (usedTitles.has(guess)) {
    showPopup("⛔ Already used");
    boxElement.classList.add("duplicate");
    return;
  }

  if (!attemptedAnswers[cellKey]) {
    attemptedAnswers[cellKey] = [];
  }

  if (attemptedAnswers[cellKey].includes(guess)) {
    showPopup("⛔ Already attempted");
    boxElement.classList.add("duplicate");
    return;
  }

  attemptedAnswers[cellKey].push(guess);

  if (!boardData || !boardData.answers[cellKey]) {
    showPopup("⚠ This cell is not defined in the board.");
    return;
  }

  const accepted = boardData.answers[cellKey].map(a => a.toLowerCase());

  if (accepted.includes("[verify]")) {
    showPopup(`⚠ Not enough data for \"${inputTitle}\"`);
    return;
  }

  if (accepted.includes(guess)) {
    showPopup("✅ Correct!");
    lockCell(inputElement, boxElement, cellKey, guess, "correct");
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