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

  loadBookData();
  loadBoardFromDate();
  setupGridClickToFocus();
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

// === Load Book Data (for autocomplete, future use) ===
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

// === Load Board Data (stub for now) ===
function loadBoardFromDate() {
  const startDate = new Date("2025-05-05");
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const boardNumber = diffDays + 1;
  const boardPath = `boards/board-${boardNumber.toString().padStart(3, "0")}.json`;

  console.log("Would load board from:", boardPath);
  // Future: fetch and inject row/column categories
}

// === Enable clicking the whole .grid-box to focus the input inside ===
function setupGridClickToFocus() {
  const boxes = document.querySelectorAll(".grid-box");

  boxes.forEach(box => {
    const input = box.querySelector(".cell-input");

    // Click anywhere on the box = focus input
    box.addEventListener("click", () => {
      input.focus();
    });

    // Optional: select text on focus
    input.addEventListener("focus", () => {
      input.select();
    });

    // Optional: basic logging for now
    input.addEventListener("input", () => {
      console.log("Typed:", input.value);
    });
  });
}