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

// === Utility Functions ===
function capitalizeTitle(title) {
const lowercaseWords = ["a", "an", "and", "but", "or", "for", "nor", "the", "as", "at", "by", "from", "in", "into", "near", "of", "on", "onto", "to", "with"];
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

function getAuthorInitials(author) {
return author.split(" ").map(word => word[0]).join("");
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
document.getElementById("toggle-hardcore").textContent = 🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"};
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

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
document.documentElement.setAttribute("data-theme", "dark");
}

loadBookData();
loadBoard(boardId);
setupGrid();
setupModals();
gameStartTime = Date.now();
});

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

// === Load Board ===
async function loadBoard(id) {
boardId = id;
try {
const response = await fetch(boards/${id}.json);
boardData = await response.json();

pgsql
Copy
Edit
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
li.textContent = #${String(index + 1).padStart(3, "0")};
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

document.getElementById("end-game-btn").addEventListener("click", () => {
endGame();
});
}

// === Accepted Answer Master List ===
function renderMasterList() {
const container = document.getElementById("accepted-answers-modal");
const existingList = document.getElementById("master-book-list");
if (existingList) existingList.remove();

const listContainer = document.createElement("div");
listContainer.id = "master-book-list";
listContainer.style.columns = "2";
listContainer.style.marginTop = "1rem";

const header = document.createElement("h3");
header.textContent = "Master List";
listContainer.appendChild(header);

const titleMap = {};
allBooks.forEach(book => {
const key = book.title.toLowerCase();
if (!titleMap[key]) titleMap[key] = [];
titleMap[key].push(book);
});

Object.keys(titleMap).sort().forEach(titleKey => {
const books = titleMap[titleKey];
const displayTitle = capitalizeTitle(books[0].title);
const p = document.createElement("p");
if (books.length > 1) {
const initials = books.map(b => (${getAuthorInitials(b.author)})).join(", ");
p.textContent = ${displayTitle} ${initials};
} else {
p.textContent = displayTitle;
}
listContainer.appendChild(p);
});

container.querySelector(".modal-content").appendChild(listContainer);
}

// === Setup Grid ===
function setupGrid() {
document.querySelectorAll(".grid-box").forEach(box => {
const input = box.querySelector(".cell-input");
const dropdown = box.querySelector(".autocomplete");
const cellKey = box.getAttribute("data-cell");
let activeIndex = -1;

javascript
Copy
Edit
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
document.getElementById("toggle-infinite").textContent = ♾️ Infinite Mode: ${infiniteMode ? "On" : "Off"};
document.getElementById("guesses-left").textContent = infiniteMode ? "∞" : guessesLeft;
});

document.getElementById("toggle-hardcore").addEventListener("click", () => {
if (Object.keys(attemptedAnswers).length > 0) {
showPopup("Hardcore Mode must be selected before your first guess.");
return;
}
hardcoreMode = !hardcoreMode;
localStorage.setItem("hardcorePreLock", hardcoreMode);
document.getElementById("toggle-hardcore").textContent = 🔥 Hardcore Mode: ${hardcoreMode ? "On" : "Off"};
});
}

// === Check Answer Logic ===
function checkAnswer(inputTitle, rowIndex, colIndex, inputElement, boxElement) {
const guess = inputTitle.trim().toLowerCase();
const cellKey = ${rowIndex}-${colIndex};

if (!acceptedTitles.includes(guess)) {
showPopup(⚠ "${capitalizeTitle(guess)}" is not in the accepted book list.);
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
showPopup(⚠ Not enough data for "${inputTitle}");
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

csharp
Copy
Edit
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
const filled = [...lockedCells];
if (filled.length === 9) {
endGame();
}
}

// === End Game Results ===
function endGame() {
const endTime = Date.now();
const elapsed = ((endTime - gameStartTime) / 1000).toFixed(2);
const modal = document.getElementById("results-modal");
const container = document.getElementById("results-breakdown");

container.innerHTML = <h2>Game Results</h2> <p><strong>Final Score:</strong> ${score}</p> <p><strong>Total Time:</strong> ${elapsed} seconds</p> <h3>Bonuses</h3> <ul> <li>X Pattern: —</li> <li>H Pattern: —</li> <li>Declared Theme Match: —</li> <li>Secret Theme Match: —</li> <li>Hardcore Mode Bonus: ${hardcoreMode ? "✓" : "—"}</li> </ul> <h3>Multipliers</h3> <ul> <li>Hardcore Mode: ${hardcoreMode ? "x1.5" : "x1.0"}</li> <li>Theme Match: —</li> </ul> ;

modal.classList.remove("hidden");
}