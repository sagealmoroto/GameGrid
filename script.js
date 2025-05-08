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
  setupTyping();
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

// === Placeholder: Load Board by Date ===
function loadBoardFromDate() {
  const startDate = new Date("2025-05-05");
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const boardNumber = diffDays + 1;
  const boardPath = `boards/board-${boardNumber.toString().padStart(3, "0")}.json`;

  console.log("Would load board from:", boardPath);
  // Future: fetch board data, populate category labels
}

// === Simulated Typing Logic ===
function setupTyping() {
  let activeCell = null;

  const boxes = document.querySelectorAll(".grid-box");
  boxes.forEach((box) => {
    box.setAttribute("tabindex", "0");
    box.setAttribute("data-input", "");

    box.addEventListener("click", () => {
      if (activeCell && activeCell !== box) {
        activeCell.classList.remove("typing");
      }
      activeCell = box;
      box.classList.add("typing");
      box.focus();
    });

    // Allow pressing "Enter" to simulate submit behavior later
    box.addEventListener("keydown", (e) => {
      e.preventDefault();

      let value = box.getAttribute("data-input") || "";

      if (e.key === "Backspace") {
        value = value.slice(0, -1);
      } else if (e.key === "Enter") {
        // Placeholder: trigger submission logic
        console.log("Submitted:", value);
      } else if (e.key.length === 1) {
        value += e.key;
      }

      box.setAttribute("data-input", value);
    });
  });

  // Allow pressing Escape to blur focus
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeCell) {
      activeCell.blur();
      activeCell.classList.remove("typing");
      activeCell = null;
    }
  });
}