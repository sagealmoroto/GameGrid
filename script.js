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

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  loadBookData(); // Load books.json when DOM is ready
  loadBoardFromDate(); // Prep for future board loading
});

// === Modal Logic ===
const modal = document.getElementById("how-to-play");
const helpBtn = document.getElementById("help-btn");
const closeBtn = document.querySelector(".close-btn");

window.addEventListener("load", () => {
  modal.classList.remove("hidden");
});

helpBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// === Book Data Loader ===
let allBooks = [];
let acceptedTitles = [];

async function loadBookData() {
  try {
    const response = await fetch("books.json");
    allBooks = await response.json();
    acceptedTitles = allBooks.map(book => book.title.toLowerCase());
    console.log("Loaded book titles:", acceptedTitles);
  } catch (err) {
    console.error("Error loading books.json:", err);
  }
}

// === Input Suggestion Logic (logs to console for now) ===
const allInputs = document.querySelectorAll(".grid-box input");

allInputs.forEach((input) => {
  input.addEventListener("input", (e) => {
    const value = e.target.value.trim().toLowerCase();

    if (value.length >= 4 || (value.length < 4 && acceptedTitles.includes(value))) {
      const suggestions = acceptedTitles.filter(title =>
        title.startsWith(value)
      );
      console.log("Suggestions:", suggestions.slice(0, 5));
    }
  });
});

// === Daily Board Loader (prep for board-001.json, etc.) ===
function loadBoardFromDate() {
  const startDate = new Date("2025-05-05");
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const boardNumber = diffDays + 1;
  const boardPath = `boards/board-${boardNumber.toString().padStart(3, "0")}.json`;

  console.log("Would load board from:", boardPath);
  // fetch(boardPath).then(...); ← We'll implement this soon
}