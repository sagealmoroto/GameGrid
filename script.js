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

// On load, apply saved theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
});

// === Modal (How to Play) ===
const modal = document.getElementById("how-to-play");
const helpBtn = document.getElementById("help-btn");
const closeBtn = document.querySelector(".close-btn");

// Show on first load
window.addEventListener("load", () => {
  modal.classList.remove("hidden");
});

// Open modal when ? clicked
helpBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

// Close modal
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// === Future Placeholder: Grid Input Suggestions ===
const allInputs = document.querySelectorAll(".grid-box input");

allInputs.forEach((input) => {
  input.addEventListener("input", (e) => {
    const value = e.target.value.trim();

    // Placeholder: log value if 4+ characters
    if (value.length >= 4 || value.length > 0 && value.length < 4) {
      console.log("Typed:", value);
    }

    // In future: fetch suggestions, show dropdown
  });
});

// === Placeholder: Load board based on date ===
// Future logic — stub for now
function loadBoardFromDate() {
  const startDate = new Date("2025-05-05");
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const boardNumber = diffDays + 1;
  const boardPath = `boards/board-${boardNumber.toString().padStart(3, "0")}.json`;

  console.log("Would load board from:", boardPath);
  // fetch(boardPath).then(...);
}

loadBoardFromDate();