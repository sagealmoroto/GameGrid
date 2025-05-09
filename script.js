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

let score = 0;
let guessesLeft = 9;
let infiniteMode = true; // toggle if needed

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  loadBookData();
  loadBoardFromDate(); // Load board and setup grid
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

// === Load Board from JSON ===
async function loadBoardFromDate() {
  try {
    const boardPath = `boards/board-001.json`; // For now, fixed file
    const response = await fetch(boardPath);
    boardData = await response.json();

    // Inject prompts
    const rowLabels = document.querySelectorAll(".row-label");
    const colLabels = document.querySelectorAll(".col-label");

    boardData.categories.rows.forEach((cat, i) => {
      rowLabels[i].textContent = cat.label;
    });
    boardData.categories.columns.forEach((cat, i) => {
      colLabels[i].textContent = cat.label;
    });

    console.log("Board loaded:", boardData);
  } catch (err) {
    console.error("Error loading board:", err);
  }
}

// === Setup Grid Interactions ===
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

      if (value.length >= 1) {
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
              input.focus();
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
          checkAnswer(input.value, row, col);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const [row, col] = cellKey.split("-").map(Number);
        checkAnswer(input.value, row, col);
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
}

// === Check Answer Against Board ===
function checkAnswer(inputTitle, rowIndex, colIndex) {
  const guess = inputTitle.trim().toLowerCase();
  const cellKey = `${rowIndex}-${colIndex}`;

  if (!attemptedAnswers[cellKey]) {
    attemptedAnswers[cellKey] = [];
  }

  if (attemptedAnswers[cellKey].includes(guess)) {
    showPopup("⛔ Already attempted");
    return;
  }

  attemptedAnswers[cellKey].push(guess);

  if (!boardData || !boardData.answers[cellKey]) {
    showPopup("⚠ This cell is not defined in the board.");
    return;
  }

  const accepted = boardData.answers[cellKey].map(a => a.toLowerCase());

  if (accepted.includes("[verify]")) {
    showPopup(`⚠ Not enough data for "${inputTitle}"`);
    return;
  }

  if (accepted.includes(guess)) {
    showPopup("✅ Correct!");
    // TODO: visually mark correct
  } else {
    showPopup("❌ Incorrect");

    if (!infiniteMode) {
      guessesLeft -= 1;
      document.getElementById("guesses-left").textContent = guessesLeft;
    }

    score += 1;
    document.getElementById("current-score").textContent = score;
  }
}